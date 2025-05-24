
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CostRegistrationModalProps {
  isOpen: boolean;
  registerCostValue: string;
  registerVatValue: string;
  onClose: () => void;
  onSave: () => void;
  setRegisterCostValue: (value: string) => void;
  setRegisterVatValue: (value: string) => void;
}

const CostRegistrationModal = ({
  isOpen,
  registerCostValue,
  registerVatValue,
  onClose,
  onSave,
  setRegisterCostValue,
  setRegisterVatValue,
}: CostRegistrationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Register Actual Cost</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actualCost">Actual Cost</Label>
            <Input
              id="actualCost"
              type="number"
              min="0"
              step="0.01"
              value={registerCostValue}
              onChange={(e) => setRegisterCostValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="actualVat">Actual VAT</Label>
            <Input
              id="actualVat"
              type="number"
              min="0"
              step="0.01"
              value={registerVatValue}
              onChange={(e) => setRegisterVatValue(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default CostRegistrationModal;
