
import { Card } from "@/components/ui/card";
import { Supplier } from "@/types/invoice";

interface SupplierDetailsProps {
  supplier: Supplier | null;
}

const SupplierDetails = ({ supplier }: SupplierDetailsProps) => {
  if (!supplier) return null;
  
  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h3 className="font-medium mb-2">Supplier Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p><span className="font-medium">Email:</span> {supplier.email}</p>
          <p><span className="font-medium">Phone:</span> {supplier.phone}</p>
          {supplier.address && (
            <p><span className="font-medium">Address:</span> {supplier.address}</p>
          )}
          <div className="flex gap-2">
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
        </div>
        <div>
          {supplier.accountNumber && (
            <p><span className="font-medium">Account Number:</span> {supplier.accountNumber}</p>
          )}
          {supplier.defaultCurrency && (
            <p><span className="font-medium">Default Currency:</span> {supplier.defaultCurrency}</p>
          )}
          {supplier.currencyRate && (
            <p><span className="font-medium">Currency Rate:</span> {supplier.currencyRate}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;
