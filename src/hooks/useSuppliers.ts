
import { useState, useEffect } from "react";
import { Supplier } from "@/types/invoice";
import { mockSuppliers } from "@/data/mockData";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchSuppliers = () => {
      setIsLoading(true);
      
      try {
        // Simulate API delay
        setTimeout(() => {
          // Load suppliers from localStorage or use mock data
          const savedSuppliers = localStorage.getItem('suppliers');
          const data = savedSuppliers ? JSON.parse(savedSuppliers) : mockSuppliers;
          setSuppliers(data);
          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setSuppliers(mockSuppliers);
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return { suppliers, isLoading };
}
