"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { Plus, LayoutDashboard, Layers, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import type { ProjectItem } from "@/core/interfaces/projects.interface";
import type { ProjectActivity } from "@/core/services/projects-mock-data";
import {
  getProjectsResponse,
  createProject,
  updateProject,
  deleteProject,
  getActivities,
  topUpProjectCredits,
} from "@/core/services/projects.service";
import { getUserProfile } from "@/core/services/users.service";

import { OverviewTab } from "./components/overview-tab";
import { ProjectsTab } from "./components/projects-tab";
import { ActivityTab } from "./components/activity-tab";
import { ConnectionDialog } from "./components/connection-dialog";
import { ProjectTopUpDialog } from "./components/project-topup-dialog";

export function ProjectsClient() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "activity">("overview");
  const [now] = useState(() => Date.now());

  // User context for activity logging
  const [userContext, setUserContext] = useState<{ userId?: string; userName?: string; userAvatar?: string } | undefined>(undefined);
  useEffect(() => {
    getUserProfile().then((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.trim();
      setUserContext({
        userId: p.empid,
        userName: fullName || p.email,
        userAvatar: p.image ?? undefined,
      });
    }).catch(() => { /* silently skip - context still works without avatar */ });
  }, []);

  // Data States
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search for Projects
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsPageSize, setProjectsPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination for Activities
  const [totalActivities, setTotalActivities] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesPageSize, setActivitiesPageSize] = useState(10);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [renameProject, setRenameProject] = useState<ProjectItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [selectedTopUpProject, setSelectedTopUpProject] = useState<ProjectItem | null>(null);
  const [selectedConnectProject, setSelectedConnectProject] = useState<ProjectItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await getProjectsResponse(projectsPage, projectsPageSize, searchQuery);
      if (res.success && res.data) {
        setProjects(res.data);
        setTotalProjects(res.meta?.total ?? res.data.length);
      }
    } catch {
      pushToast("Failed to load projects.", "error");
    }
  }, [projectsPage, projectsPageSize, searchQuery, pushToast]);

  // Load Activities
  const fetchActivities = useCallback(async () => {
    try {
      const res = await getActivities(activitiesPage, activitiesPageSize);
      if (res.success && res.data) {
        setActivities(res.data);
        setTotalActivities(res.total);
      }
    } catch {
      pushToast("Failed to load activities.", "error");
    }
  }, [activitiesPage, activitiesPageSize, pushToast]);

  // Combined fetch
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProjects(), fetchActivities()]);
    setIsLoading(false);
  }, [fetchProjects, fetchActivities]);

  useEffect(() => {
    startTransition(() => {
      void reloadData();
    });
  }, [reloadData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject({ name: newProjectName.trim() }, undefined, userContext);
      pushToast("Project created successfully.", "success");
      setIsCreateOpen(false);
      setNewProjectName("");
      reloadData();
    } catch {
      pushToast("Failed to create project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameProject || !renameValue.trim()) return;
    setIsSubmitting(true);
    try {
      await updateProject(renameProject.id, { name: renameValue.trim() }, undefined, userContext);
      pushToast("Project renamed successfully.", "success");
      setRenameProject(null);
      setRenameValue("");
      reloadData();
    } catch {
      pushToast("Failed to rename project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProject(projectToDelete.id, undefined, userContext);
      pushToast("Project deleted successfully.", "success");
      setProjectToDelete(null);
      reloadData();
    } catch {
      pushToast("Failed to delete project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagerShell
      title="Projects Dashboard"
      description="Monitor active projects, resources connections, and activity streams."
      actions={
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-9 px-4 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="size-4" />
          Create Project
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 select-none">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "projects", label: "Projects List", icon: Layers },
            { id: "activity", label: "Activity Log", icon: Activity },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "projects" | "activity")}
                className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center cursor-pointer transition-colors ${
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-slate-500 hover:text-slate-750"
                }`}
              >
                <tab.icon className="size-4 mr-1.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === "overview" && (
          <OverviewTab
            projects={projects}
            activities={activities}
            onTopUpClick={setSelectedTopUpProject}
            onConnectClick={setSelectedConnectProject}
            now={now}
          />
        )}

        {activeTab === "projects" && (
          <ProjectsTab
            projects={projects}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={(val) => {
              setSearchQuery(val);
              setProjectsPage(1);
            }}
            currentPage={projectsPage}
            pageSize={projectsPageSize}
            totalItems={totalProjects}
            onPageChange={setProjectsPage}
            onPageSizeChange={(size) => {
              setProjectsPageSize(size);
              setProjectsPage(1);
            }}
            onTopUpClick={setSelectedTopUpProject}
            onRenameClick={(p) => {
              setRenameProject(p);
              setRenameValue(p.name);
            }}
            onConnectClick={setSelectedConnectProject}
            onDeleteClick={setProjectToDelete}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab
            activities={activities}
            totalActivities={totalActivities}
            currentPage={activitiesPage}
            pageSize={activitiesPageSize}
            onPageChange={setActivitiesPage}
            onPageSizeChange={(size) => {
              setActivitiesPageSize(size);
              setActivitiesPage(1);
            }}
            isLoading={isLoading}
            now={now}
          />
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[400px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6 select-none">
          <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900">Create Project</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Add a new project to allocate credits and link resources.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="new-project-name" className="text-xs font-bold text-slate-600">
                Project Name
              </label>
              <Input
                id="new-project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={isSubmitting}
                className="text-sm font-semibold text-slate-805 h-10 rounded-lg border-slate-200/80 focus:border-brand/40"
                required
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className="h-10 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newProjectName.trim()}
                className="h-10 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer"
              >
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameProject} onOpenChange={(open) => !open && setRenameProject(null)}>
        <DialogContent className="max-w-[400px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6 select-none">
          <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900">Rename Project</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Update the name of your project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label htmlFor="rename-project-name" className="text-xs font-bold text-slate-600">
                New Project Name
              </label>
              <Input
                id="rename-project-name"
                placeholder="Enter new name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                disabled={isSubmitting}
                className="text-sm font-semibold text-slate-805 h-10 rounded-lg border-slate-200/80 focus:border-brand/40"
                required
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRenameProject(null)}
                disabled={isSubmitting}
                className="h-10 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !renameValue.trim()}
                className="h-10 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {projectToDelete && (
        <ManagerDeleteConfirm
          itemName={projectToDelete.name}
          itemId={projectToDelete.id}
          itemTypeLabel="project"
          onCancel={() => setProjectToDelete(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={isSubmitting}
        />
      )}

      <ProjectTopUpDialog
        project={selectedTopUpProject}
        open={!!selectedTopUpProject}
        onOpenChange={(open) => !open && setSelectedTopUpProject(null)}
        onSuccess={() => {
          pushToast("Credits topped up successfully.", "success");
          reloadData();
        }}
        onTopUp={(id, amount) => topUpProjectCredits(id, amount, undefined, userContext)}
      />

      <ConnectionDialog
        project={selectedConnectProject}
        open={!!selectedConnectProject}
        onOpenChange={(open) => !open && setSelectedConnectProject(null)}
        onSuccess={() => {
          pushToast("Resource connections updated successfully.", "success");
          reloadData();
        }}
        userContext={userContext}
      />
    </ManagerShell>
  );
}
