
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
        
        if (error) {
          console.error('Error fetching suppliers:', error);
          setSuppliers([]);
        } else {
          // Transform database format to match our interface
          const transformedSuppliers: Supplier[] = data.map(supplier => ({
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
          }));
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
