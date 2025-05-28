
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ProjectSearchForm = () => {
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [projectNumber, setProjectNumber] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // TODO: Implement project search logic here
    console.log("Searching projects with:", { projectDescription, projectNumber });
    
    // For now, set empty results as placeholder
    setSearchResults([]);
    setHasSearched(true);
  };

  const handleClear = () => {
    setProjectDescription("");
    setProjectNumber("");
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <Input
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Search by project description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input
                id="projectNumber"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Search by project number..."
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Project Search Results
              {searchResults.length > 0 && (
                <span className="text-sm font-normal ml-2 text-gray-500">
                  ({searchResults.length} items found)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="text-center py-8 text-gray-500">
                Project results will be displayed here.
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No projects found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ProjectSearchForm;
