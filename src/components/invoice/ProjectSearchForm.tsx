import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock } from "lucide-react";

interface Project {
  id: string;
  projectNumber: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ProjectSearchFormProps {
  onProjectSelect?: (project: Project) => void;
  selectedProject?: Project | null;
  disabled?: boolean;
}

const ProjectSearchForm = ({ onProjectSelect, selectedProject, disabled = false }: ProjectSearchFormProps) => {
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [projectNumber, setProjectNumber] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Check if project selection is locked (when a project is already connected or disabled)
  const isProjectLocked = selectedProject !== null || disabled;

  const exampleProjects: Project[] = [
    {
      id: "proj-001",
      projectNumber: "PRJ-2024-001",
      description: "Office Building Construction",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2024-12-31"
    },
    {
      id: "proj-002",
      projectNumber: "PRJ-2024-002", 
      description: "Road Infrastructure Upgrade",
      status: "Planning",
      startDate: "2024-03-01",
      endDate: "2024-08-30"
    },
    {
      id: "proj-003",
      projectNumber: "PRJ-2024-003",
      description: "Hospital Renovation Project",
      status: "Active",
      startDate: "2024-02-10",
      endDate: "2024-11-15"
    },
    {
      id: "proj-004",
      projectNumber: "PRJ-2023-015",
      description: "Shopping Mall Development",
      status: "Completed",
      startDate: "2023-06-01",
      endDate: "2024-01-20"
    },
    {
      id: "proj-005",
      projectNumber: "PRJ-2024-004",
      description: "School Campus Expansion",
      status: "Active",
      startDate: "2024-04-01",
      endDate: "2025-02-28"
    }
  ];

  const handleSearch = () => {
    if (isProjectLocked) return; // Prevent search when locked
    
    console.log("Searching projects with:", { projectDescription, projectNumber });
    
    const filtered = exampleProjects.filter(project => {
      const matchesDescription = !projectDescription || 
        project.description.toLowerCase().includes(projectDescription.toLowerCase());
      const matchesNumber = !projectNumber || 
        project.projectNumber.toLowerCase().includes(projectNumber.toLowerCase());
      
      return matchesDescription && matchesNumber;
    });
    
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    if (isProjectLocked) return; // Prevent clear when locked
    
    setProjectDescription("");
    setProjectNumber("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSelectProject = (project: Project) => {
    if (isProjectLocked) return; // Prevent selection when locked
    
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Search Projects
            {isProjectLocked && (
              <Lock className="h-4 w-4 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProjectLocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <Lock className="inline h-4 w-4 mr-1" />
                A project is already connected to this supplier invoice. Remove the current project before selecting a different one.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description</Label>
              <Input
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Search by project description..."
                disabled={isProjectLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input
                id="projectNumber"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Search by project number..."
                disabled={isProjectLocked}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isProjectLocked}
            >
              Clear
            </Button>
            <Button 
              onClick={handleSearch}
              disabled={isProjectLocked}
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isProjectLocked && hasSearched && (
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectNumber}</TableCell>
                      <TableCell>{project.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === 'Active' ? 'bg-green-100 text-green-800' :
                          project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(project.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(project.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectProject(project)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
