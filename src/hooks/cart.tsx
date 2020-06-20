import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem('@GoMarketplaceCart');
      storagedProducts && setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Partial<Product>) => {
      const existentProduct = products.find(p => p.id === product.id);
      if (!existentProduct) {
        const newProduct = { ...product, quantity: 1 } as Product;
        const newProducts = [...products, newProduct];
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplaceCart',
          JSON.stringify(products),
        );
      } else {
        const newProducts = products.map(p => {
          if (p.id === existentProduct.id) {
            return { ...p, quantity: p.quantity += 1 };
          }
          return p;
        });

        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplaceCart',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const existentProduct = products.find(p => p.id === id);
      const newProducts = products.map(p => {
        if (p.id === existentProduct?.id) {
          return { ...p, quantity: p.quantity += 1 };
        }
        return p;
      });
      setProducts(newProducts);
      await AsyncStorage.setItem(
        '@GoMarketplaceCart',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const existentProduct = products.find(p => p.id === id);
      if (existentProduct) {
        const newProducts = products.map(p => {
          if (p.id === existentProduct?.id) {
            return { ...p, quantity: Math.max((p.quantity -= 1), 1) };
          }
          return p;
        });
        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplaceCart',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
