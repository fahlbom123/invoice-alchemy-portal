
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  projectNumber: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

export function useSupabaseProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('project_number');
        
        if (error) {
          console.error('Error fetching projects:', error);
          setProjects([]);
        } else {
          // Transform database format to match our interface
          const transformedProjects: Project[] = data.map(project => ({
            id: project.id,
            projectNumber: project.project_number,
            description: project.description,
            status: project.status,
            startDate: project.start_date,
            endDate: project.end_date
          }));
          setProjects(transformedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, isLoading };
}
