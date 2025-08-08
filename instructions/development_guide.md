## Development Guidelines

### Code Organization and Aliases

The project uses Babel module resolver for clean imports. Always use these aliases instead of relative paths:

#### Available Aliases
```typescript
// Instead of: import { useAuthStore } from '../../../store/auth-store'
import { useAuthStore } from '@store/auth-store'

// Instead of: import { theme } from '../../theme'
import { theme } from '@/theme'

// Instead of: import ProductCard from '../../../components/product-card'
import ProductCard from '@components/product-card'

// Instead of: import { formatPrice } from '../../utils/price-formatter'
import { formatPrice } from '@utils/price-formatter'

// Instead of: import { Product } from '../types/api'
import { Product } from '@types/api'

// Instead of: import heroImage from '../../../assets/images/hero.png'
import heroImage from '@assets/images/hero.png'
```

#### Alias Configuration
```javascript
// babel.config.js
{
  '@': './src',
  '@assets': './assets',
  '@components': './src/components',
  '@utils': './src/utils',
  '@types': './src/types',
  '@store': './src/store',
}
```

### Styling Best Practices

#### Using the Theme System
```typescript
import { theme } from '@/theme'

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.sm,
    ...theme.shadows.md,
  },
})
```

#### Color Usage Guidelines
```typescript
// ✅ Correct - Use theme colors
backgroundColor: theme.colors.black
color: theme.colors.white
borderColor: theme.colors.lightGray

// ❌ Avoid - Hardcoded colors
backgroundColor: '#000000'
color: '#FFFFFF'
borderColor: '#EFEFEF'
```

### Component Development

#### Component Structure
```typescript
// @components/ProductCard.tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { theme } from '@/theme'
import { Product } from '@types/api'

interface ProductCardProps {
  product: Product
  onPress: (product: Product) => void
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(product)}
    >
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>{product.price}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
})
```

### State Management

#### Store Structure
```typescript
// @store/product-store.ts
import { create } from 'zustand'
import { Product } from '@types/api'

interface ProductState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  clearError: () => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      // API call logic
      const products = await fetchProductsFromAPI()
      set({ products, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  clearError: () => set({ error: null }),
}))
```

* **Always** use **pnpm** for package management in this project.
* **Never** use `npm install`, `yarn add`, or `npx` unless explicitly instructed otherwise.
* Use `pnpm dlx` instead of `npx` for running on-demand packages.

---

## **1. Environment & Versions**

* Node is managed via **nvm** (Node Version Manager).
* Use **Node LTS** (`nvm use --lts`).
* Use **pnpm** version that matches `.npmrc` in the repo.
* Store Node version in `.node-version` file:

  ```plaintext
  20.11.1
  ```
* Store pnpm version in `.npmrc`:

  ```plaintext
  package-manager=pnpm@9.12.1
  ```

---

## **2. Installing Packages**

* To add dependencies:

  ```bash
  pnpm add <package-name>
  ```
* To add dev dependencies:

  ```bash
  pnpm add -D <package-name>
  ```
* To remove a dependency:

  ```bash
  pnpm remove <package-name>
  ```

---

## **3. Creating New Projects**

* When generating a new Expo project:

  ```bash
  pnpm dlx create-expo-app@latest .
  ```

  *(dot means current directory — don’t create nested folders)*

---

## **4. Installing & Updating**

* Install dependencies:

  ```bash
  pnpm install
  ```
* If dependency resolution issues occur:

  ```bash
  pnpm install --shamefully-hoist
  ```
* To update all packages:

  ```bash
  pnpm update --latest
  ```

---

## **5. Running the App**

* Start development server:

  ```bash
  pnpm run start
  ```
* Run iOS simulator:

  ```bash
  pnpm run ios
  ```
* Run Android emulator:

  ```bash
  pnpm run android
  ```
* Run web:

  ```bash
  pnpm run web
  ```

---

## **6. Important Notes**

* Never mix package managers in this repo — no `node_modules` from npm/yarn should exist.
* If `package-lock.json` or `yarn.lock` appears, delete them — only keep `pnpm-lock.yaml`.
* Always commit `pnpm-lock.yaml` to ensure consistent installs across environments.
* If AI assistant suggests `npm` or `yarn`, **replace** it with the pnpm equivalent.

