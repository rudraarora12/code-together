import * as Y from 'yjs';

/**
 * Mutex helper to prevent circular events between Monaco and Yjs
 */
function createMutex() {
  let token = true;
  return (fn) => {
    if (token) {
      token = false;
      try {
        fn();
      } finally {
        token = true;
      }
    }
  };
}

class RelativeSelection {
  constructor(start, end, direction) {
    this.start = start;
    this.end = end;
    this.direction = direction;
  }
}

const createRelativeSelection = (editor, monacoModel, type, monaco) => {
  const sel = editor.getSelection();
  if (sel !== null) {
    const startPos = sel.getStartPosition();
    const endPos = sel.getEndPosition();
    const start = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(startPos));
    const end = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(endPos));
    return new RelativeSelection(start, end, sel.getDirection());
  }
  return null;
};

const createMonacoSelectionFromRelativeSelection = (editor, type, relSel, doc, monaco) => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = editor.getModel();
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return monaco.Selection.createWithDirection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column,
      relSel.direction
    );
  }
  return null;
};

/**
 * MonacoBinding connects Monaco Editor to Yjs Text and Awareness
 */
export class MonacoBinding {
  constructor(ytext, monacoModel, editors, awareness, monaco) {
    this.doc = ytext.doc;
    this.ytext = ytext;
    this.monacoModel = monacoModel;
    this.editors = editors instanceof Set ? editors : new Set([editors]);
    this.awareness = awareness;
    this.monaco = monaco || window.monaco;
    this.mux = createMutex();
    this._savedSelections = new Map();
    this._decorations = new Map();

    // 1. Transaction handling
    this._beforeTransaction = () => {
      this.mux(() => {
        this._savedSelections = new Map();
        this.editors.forEach((editor) => {
          if (editor.getModel() === this.monacoModel) {
            const rsel = createRelativeSelection(editor, this.monacoModel, this.ytext, this.monaco);
            if (rsel !== null) {
              this._savedSelections.set(editor, rsel);
            }
          }
        });
      });
    };
    this.doc.on('beforeAllTransactions', this._beforeTransaction);

    // 2. Render remote decorations (cursors & selections)
    this._rerenderDecorations = () => {
      this.editors.forEach((editor) => {
        if (this.awareness && editor.getModel() === this.monacoModel) {
          const currentDecorations = this._decorations.get(editor) || [];
          const newDecorations = [];

          this.awareness.getStates().forEach((state, clientID) => {
            if (
              clientID !== this.doc.clientID &&
              state.selection != null &&
              state.selection.anchor != null &&
              state.selection.head != null
            ) {
              const anchorAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.anchor, this.doc);
              const headAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.head, this.doc);

              if (anchorAbs !== null && headAbs !== null && anchorAbs.type === this.ytext && headAbs.type === this.ytext) {
                let start, end, afterContentClassName, beforeContentClassName;
                if (anchorAbs.index < headAbs.index) {
                  start = this.monacoModel.getPositionAt(anchorAbs.index);
                  end = this.monacoModel.getPositionAt(headAbs.index);
                  afterContentClassName = 'yRemoteSelectionHead yRemoteSelectionHead-' + clientID;
                  beforeContentClassName = null;
                } else {
                  start = this.monacoModel.getPositionAt(headAbs.index);
                  end = this.monacoModel.getPositionAt(anchorAbs.index);
                  afterContentClassName = null;
                  beforeContentClassName = 'yRemoteSelectionHead yRemoteSelectionHead-' + clientID;
                }

                newDecorations.push({
                  range: new this.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                  options: {
                    className: 'yRemoteSelection yRemoteSelection-' + clientID,
                    afterContentClassName,
                    beforeContentClassName
                  }
                });
              }
            }
          });

          this._decorations.set(editor, editor.deltaDecorations(currentDecorations, newDecorations));
        } else {
          this._decorations.delete(editor);
        }
      });
    };

    // 3. Yjs text observer -> update Monaco
    this._ytextObserver = (event) => {
      this.mux(() => {
        let index = 0;
        event.delta.forEach((op) => {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = this.monacoModel.getPositionAt(index);
            const range = new this.monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
            const insert = String(op.insert);
            this.monacoModel.applyEdits([{ range, text: insert }]);
            index += insert.length;
          } else if (op.delete !== undefined) {
            const pos = this.monacoModel.getPositionAt(index);
            const endPos = this.monacoModel.getPositionAt(index + op.delete);
            const range = new this.monaco.Selection(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column);
            this.monacoModel.applyEdits([{ range, text: '' }]);
          }
        });

        this._savedSelections.forEach((rsel, editor) => {
          const sel = createMonacoSelectionFromRelativeSelection(editor, this.ytext, rsel, this.doc, this.monaco);
          if (sel !== null) {
            editor.setSelection(sel);
          }
        });
      });
      this._rerenderDecorations();
    };

    this.ytext.observe(this._ytextObserver);

    // Initial sync
    const ytextValue = this.ytext.toString();
    if (this.monacoModel.getValue() !== ytextValue) {
      this.monacoModel.setValue(ytextValue);
    }

    // 4. Monaco changes -> update Yjs
    this._monacoChangeHandler = this.monacoModel.onDidChangeContent((event) => {
      this.mux(() => {
        this.doc.transact(() => {
          event.changes
            .slice()
            .sort((a, b) => b.rangeOffset - a.rangeOffset)
            .forEach((change) => {
              this.ytext.delete(change.rangeOffset, change.rangeLength);
              this.ytext.insert(change.rangeOffset, change.text);
            });
        }, this);
      });
    });

    this._monacoDisposeHandler = this.monacoModel.onWillDispose(() => {
      this.destroy();
    });

    // 5. Cursor & selection tracking
    if (this.awareness) {
      this.editors.forEach((editor) => {
        const disposable = editor.onDidChangeCursorSelection(() => {
          if (editor.getModel() === this.monacoModel) {
            const sel = editor.getSelection();
            if (sel === null) return;

            let anchor = this.monacoModel.getOffsetAt(sel.getStartPosition());
            let head = this.monacoModel.getOffsetAt(sel.getEndPosition());

            if (sel.getDirection() === this.monaco.SelectionDirection.RTL) {
              const tmp = anchor;
              anchor = head;
              head = tmp;
            }

            this.awareness.setLocalStateField('selection', {
              anchor: Y.createRelativePositionFromTypeIndex(this.ytext, anchor),
              head: Y.createRelativePositionFromTypeIndex(this.ytext, head)
            });
          }
        });
        editor._ySelectionListener = disposable;
      });

      this.awareness.on('change', this._rerenderDecorations);
    }
  }

  destroy() {
    if (this._monacoChangeHandler) this._monacoChangeHandler.dispose();
    if (this._monacoDisposeHandler) this._monacoDisposeHandler.dispose();
    this.ytext.unobserve(this._ytextObserver);
    this.doc.off('beforeAllTransactions', this._beforeTransaction);

    if (this.awareness) {
      this.awareness.off('change', this._rerenderDecorations);
    }

    this.editors.forEach((editor) => {
      if (editor._ySelectionListener) {
        editor._ySelectionListener.dispose();
      }
      this._decorations.delete(editor);
    });
  }
}
