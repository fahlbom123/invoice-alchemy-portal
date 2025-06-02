
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import ProjectSearchForm from "./ProjectSearchForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  projectNumber: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ProjectSelectorProps {
  selectedProject?: Project | null;
  onProjectSelect: (project: Project) => void;
  onProjectRemove: () => void;
  disabled?: boolean;
}

const ProjectSelector = ({ selectedProject, onProjectSelect, onProjectRemove, disabled = false }: ProjectSelectorProps) => {
  const [showProjectSearch, setShowProjectSearch] = useState(false);

  const handleProjectSelect = (project: Project) => {
    onProjectSelect(project);
    setShowProjectSearch(false);
  };

  if (showProjectSearch) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium">Select Project</h4>
          <Button 
            variant="outline" 
            onClick={() => setShowProjectSearch(false)}
          >
            Cancel
          </Button>
        </div>
        <ProjectSearchForm
          onProjectSelect={handleProjectSelect}
          selectedProject={selectedProject}
          disabled={disabled}
        />
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Project</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {selectedProject.projectNumber} - {selectedProject.description}
            </span>
            {!disabled && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectSearch(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Project</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this project from the invoice?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onProjectRemove}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Project</span>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowProjectSearch(true)}
          disabled={disabled}
          className="w-fit"
        >
          Select Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectSelector;
