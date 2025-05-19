
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center pt-20 pb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Supplier Invoice Management System</h1>
          <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
            Efficiently track and manage your supplier invoices with estimated costs and detailed supplier information.
            Match estimated costs with actual costs from customer invoices.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/invoice-lines/search')}
            >
              Search Invoice Lines
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
