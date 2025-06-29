
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/invoice";

export function useSupabaseSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name');
        
        console.log('Raw supplier data from database:', data); // Debug log
        
        if (error) {
          console.error('Error fetching suppliers:', error);
          setSuppliers([]);
        } else {
          // Transform database format to match our interface
          const transformedSuppliers: Supplier[] = data.map(supplier => {
            console.log('Processing supplier:', supplier.name, 'payment_days:', supplier.payment_days); // Debug log
            return {
              id: supplier.id,
              name: supplier.name,
              email: supplier.email,
              phone: supplier.phone,
              accountNumber: supplier.account_number,
              defaultCurrency: supplier.default_currency,
              currencyRate: supplier.currency_rate,
              paymentDays: supplier.payment_days,
              address: supplier.address,
              zipCode: supplier.zip_code,
              city: supplier.city,
              country: supplier.country,
              iban: supplier.iban,
              swift: supplier.swift
            };
          });
          console.log('Transformed suppliers:', transformedSuppliers); // Debug log
          setSuppliers(transformedSuppliers);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setSuppliers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return { suppliers, isLoading };
}
