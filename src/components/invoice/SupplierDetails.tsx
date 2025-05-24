
import { Card } from "@/components/ui/card";
import { Supplier } from "@/types/invoice";

interface SupplierDetailsProps {
  supplier: Supplier | null;
}

const SupplierDetails = ({ supplier }: SupplierDetailsProps) => {
  if (!supplier) return null;
  
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h3 className="font-medium mb-3">Supplier Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
          <p><span className="font-medium">Email:</span> {supplier.email}</p>
          <p><span className="font-medium">Phone:</span> {supplier.phone}</p>
          {supplier.accountNumber && (
            <p><span className="font-medium">Account Number:</span> {supplier.accountNumber}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 mb-2">Address</h4>
          {supplier.address ? (
            <>
              <p><span className="font-medium">Street:</span> {supplier.address}</p>
              <div className="flex gap-4">
                {supplier.zipCode && (
                  <p><span className="font-medium">Zip:</span> {supplier.zipCode}</p>
                )}
                {supplier.city && (
                  <p><span className="font-medium">City:</span> {supplier.city}</p>
                )}
              </div>
              {supplier.country && (
                <p><span className="font-medium">Country:</span> {supplier.country}</p>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">No address information available</p>
          )}
        </div>
        
        {(supplier.defaultCurrency || supplier.currencyRate) && (
          <div className="space-y-2 md:col-span-2">
            <h4 className="font-medium text-gray-700 mb-2">Currency Information</h4>
            <div className="flex gap-6">
              {supplier.defaultCurrency && (
                <p><span className="font-medium">Default Currency:</span> {supplier.defaultCurrency}</p>
              )}
              {supplier.currencyRate && (
                <p><span className="font-medium">Currency Rate:</span> {supplier.currencyRate}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDetails;
