
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";

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
  
  const { projects, isLoading: projectsLoading } = useSupabaseProjects();

  const handleSearch = () => {
    if (disabled) return;
    
    console.log("Searching projects with:", { projectDescription, projectNumber });
    console.log("Available projects:", projects);
    
    // If no search criteria provided, show all projects
    if (!projectDescription.trim() && !projectNumber.trim()) {
      setSearchResults(projects);
      setHasSearched(true);
      return;
    }
    
    const filtered = projects.filter(project => {
      const matchesDescription = !projectDescription.trim() || 
        project.description.toLowerCase().includes(projectDescription.toLowerCase().trim());
      const matchesNumber = !projectNumber.trim() || 
        project.projectNumber.toLowerCase().includes(projectNumber.toLowerCase().trim());
      
      return matchesDescription && matchesNumber;
    });
    
    console.log("Filtered results:", filtered);
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    if (disabled) return;
    
    setProjectDescription("");
    setProjectNumber("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSelectProject = (project: Project) => {
    if (disabled) return;
    
    console.log("Selected project:", project);
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  // Auto-search when component mounts to show available projects
  React.useEffect(() => {
    if (projects.length > 0 && !hasSearched) {
      setSearchResults(projects);
      setHasSearched(true);
    }
  }, [projects, hasSearched]);

  if (projectsLoading) {
    return <div className="text-center py-4">Loading projects...</div>;
  }

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
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input
                id="projectNumber"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Search by project number..."
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={disabled}
            >
              Clear
            </Button>
            <Button 
              onClick={handleSearch}
              disabled={disabled}
            >
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
                          disabled={disabled}
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
                {projects.length === 0 && (
                  <div className="mt-2 text-sm">
                    No projects available in the database.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ProjectSearchForm;
