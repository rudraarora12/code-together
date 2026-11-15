export const LANGUAGE_TEMPLATES = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: 'js',
    icon: 'FileCode2',
    color: '#f7df1e',
    files: [
      {
        id: 'file-1',
        name: 'index.js',
        language: 'javascript',
        content: `// Welcome to CodeTogether!
// Real-time collaborative coding in JavaScript

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("=== CodeTogether Real-Time Runner ===");
const terms = 10;
console.log(\`Calculating first \${terms} Fibonacci numbers:\`);

for (let i = 0; i < terms; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// Try editing this code simultaneously with a collaborator!
const collaborators = ["Alice", "Bob", "You"];
console.log("\\nActive collaborators:", collaborators.join(", "));
`
      },
      {
        id: 'file-2',
        name: 'utils.js',
        language: 'javascript',
        content: `export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function debounce(fn, ms = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
`
      },
      {
        id: 'file-3',
        name: 'README.md',
        language: 'markdown',
        content: `# Collaborative JavaScript Project

Welcome to your shared workspace!
- Press **Run** (or \`Ctrl+Enter\`) to execute code.
- Click **Share** to invite teammates with your Room ID.
- Changes synchronize instantly across all participants.
`
      }
    ]
  },
  python: {
    id: 'python',
    name: 'Python 3',
    extension: 'py',
    icon: 'FileCode',
    color: '#387eb8',
    files: [
      {
        id: 'file-1',
        name: 'main.py',
        language: 'python',
        content: `# Welcome to CodeTogether!
# Real-time collaborative coding in Python

import math

def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        is_prime = True
        for i in range(2, int(math.sqrt(num)) + 1):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(num)
    return primes

print("=== CodeTogether Python Sandbox ===")
limit = 30
primes = calculate_primes(limit)
print(f"Prime numbers up to {limit}:")
print(primes)
print(f"Found {len(primes)} primes successfully.")
`
      },
      {
        id: 'file-2',
        name: 'data.py',
        language: 'python',
        content: `USERS = [
    {"id": 1, "name": "Alice", "role": "Architect"},
    {"id": 2, "name": "Bob", "role": "Fullstack Dev"},
    {"id": 3, "name": "Charlie", "role": "Code Reviewer"}
]

def get_user_by_id(uid):
    return next((u for u in USERS if u["id"] == uid), None)
`
      }
    ]
  },
  cpp: {
    id: 'cpp',
    name: 'C++ 20',
    extension: 'cpp',
    icon: 'FileCode',
    color: '#659ad2',
    files: [
      {
        id: 'file-1',
        name: 'main.cpp',
        language: 'cpp',
        content: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "=== CodeTogether C++ Runner ===" << std::endl;
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    double average = static_cast<double>(sum) / numbers.size();
    
    std::cout << "Array elements: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;
    std::cout << "Total Sum: " << sum << std::endl;
    std::cout << "Average: " << average << std::endl;
    
    return 0;
}
`
      }
    ]
  },
  java: {
    id: 'java',
    name: 'Java 17',
    extension: 'java',
    icon: 'FileCode',
    color: '#ea2d2e',
    files: [
      {
        id: 'file-1',
        name: 'Main.java',
        language: 'java',
        content: `import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== CodeTogether Java Sandbox ===");
        
        List<String> team = Arrays.asList("Alice (Owner)", "Bob (Editor)", "Charlie (Reviewer)");
        
        System.out.println("Current Active Room Members:");
        team.forEach(member -> System.out.println(" - " + member));
        
        int a = 15;
        int b = 25;
        System.out.println("Result of " + a + " + " + b + " = " + (a + b));
    }
}
`
      }
    ]
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    icon: 'FileCode2',
    color: '#3178c6',
    files: [
      {
        id: 'file-1',
        name: 'app.ts',
        language: 'typescript',
        content: `// TypeScript Collaborative Workspace
interface Collaborator {
  id: string;
  name: string;
  color: string;
  activeLine: number;
}

const collaborators: Collaborator[] = [
  { id: '1', name: 'Rudra', color: '#89b4fa', activeLine: 12 },
  { id: '2', name: 'Elena', color: '#f38ba8', activeLine: 24 }
];

function greet(c: Collaborator): string {
  return \`Welcome \${c.name}! Working on line \${c.activeLine}\`;
}

collaborators.forEach(c => console.log(greet(c)));
`
      }
    ]
  }
};
