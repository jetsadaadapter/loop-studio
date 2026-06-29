"use client";

import { useEffect, useState, useCallback, startTransition, useRef, useMemo } from "react";
import { LayoutDashboard, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import type { ProjectItem } from "@/core/interfaces/projects.interface";
import {
  getProjectsResponse,
  createProject,
  updateProject,
  deleteProject,
  topUpProjectCredits,
} from "@/core/services/projects.service";
import { getUserProfile } from "@/core/services/users.service";

import { OverviewTab } from "./components/overview-tab";
import { ProjectsTab } from "./components/projects-tab";
import { ProjectTopUpDialog } from "./components/project-topup-dialog";

export function ProjectsClient() {
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "projects">("overview");

  // User context for activity logging
  const [userContext, setUserContext] = useState<{ userId?: string; userName?: string; userAvatar?: string } | undefined>(undefined);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  useEffect(() => {
    getUserProfile().then((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.trim();
      setUserContext({
        userId: p.empid,
        userName: fullName || p.email,
        userAvatar: p.image ?? undefined,
      });
      setUserRoles(p.roles ?? []);
    }).catch(() => { /* silently skip */ });
  }, []);

  // Only admin / system-admin may top-up credits
  const canTopUp = userRoles.some((r) => r === "admin" || r === "system-admin");

  // Data States
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination & Search for Projects
  const [totalProjects, setTotalProjects] = useState(0);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsPageSize, setProjectsPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(val);
      setProjectsPage(1);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Users map: userId (empid) -> { name, avatar } for resolving project owner names on cards
  const usersMap = useMemo<Record<string, { name: string; avatar?: string }>>(() => {
    if (!userContext?.userId || !userContext?.userName) return {};
    return {
      [userContext.userId]: {
        name: userContext.userName,
        avatar: userContext.userAvatar,
      },
    };
  }, [userContext]);

  // Client-side filtering & pagination for Projects
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [projects, searchQuery]);


  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createTouched, setCreateTouched] = useState(false);
  const [renameProject, setRenameProject] = useState<ProjectItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameTouched, setRenameTouched] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [selectedTopUpProject, setSelectedTopUpProject] = useState<ProjectItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset touched states when modals open
  useEffect(() => {
    if (isCreateOpen) {
      Promise.resolve().then(() => {
        setNewProjectName("");
        setCreateTouched(false);
      });
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (renameProject) {
      Promise.resolve().then(() => {
        setRenameTouched(false);
      });
    }
  }, [renameProject]);

  const createError = createTouched && !newProjectName.trim()
    ? "Project name is required."
    : "";

  const renameError = renameTouched && !renameValue.trim()
    ? "Project name is required."
    : "";

  // Load Projects (fetches projects page-by-page from the backend)
  const fetchProjects = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;
    if (isSilent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await getProjectsResponse(projectsPage, projectsPageSize);
      if (res.success && res.data) {
        setProjects(res.data);
        setTotalProjects(res.meta?.total ?? res.data.length);
        setLastUpdatedAt(new Date());
      }
    } catch {
      pushToast("Failed to load projects.", "error");
    } finally {
      if (isSilent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [projectsPage, projectsPageSize, pushToast]);

  // Combined fetch
  const reloadData = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? true;
    if (isSilent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      await fetchProjects({ silent: isSilent });
    } finally {
      if (isSilent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [fetchProjects]);

  const isProjectsInitialMount = useRef(true);

  // Projects loader & reaction effect: initial load and pagination reaction
  useEffect(() => {
    if (isProjectsInitialMount.current) {
      isProjectsInitialMount.current = false;
      startTransition(() => {
        void fetchProjects({ silent: false });
      });
      return;
    }

    startTransition(() => {
      void fetchProjects({ silent: false });
    });
  }, [fetchProjects, projectsPage, projectsPageSize]);


  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTouched(true);
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject({ name: newProjectName.trim() }, undefined, userContext);
      pushToast("Project created successfully.", "success");
      setIsCreateOpen(false);
      setNewProjectName("");
      setCreateTouched(false);
      reloadData();
    } catch {
      pushToast("Failed to create project.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenameTouched(true);
    if (!renameProject || !renameValue.trim()) return;
    setIsSubmitting(true);
    try {
      await updateProject(renameProject.id, { name: renameValue.trim() }, undefined, userContext);
      pushToast("Project renamed successfully.", "success");
      setRenameProject(null);
      setRenameValue("");
      setRenameTouched(false);
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
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 select-none">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "projects", label: "Projects List", icon: Layers },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "projects")}
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
            onTopUpClick={setSelectedTopUpProject}
            canTopUp={canTopUp}
          />
        )}

        {activeTab === "projects" && (
          <ProjectsTab
            projects={filteredProjects}
            isLoading={isLoading}
            searchQuery={searchInput}
            onSearchChange={handleSearchChange}
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
            onDeleteClick={setProjectToDelete}
            onCreateClick={() => setIsCreateOpen(true)}
            onRefresh={() => reloadData({ silent: true })}
            isRefreshing={isRefreshing}
            lastUpdatedAt={lastUpdatedAt}
            userContext={userContext}
            usersMap={usersMap}
            canTopUp={canTopUp}
          />
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[400px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6 select-none">
          <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">Create Project</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Add a new project to allocate credits and link resources.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
            <Field>
              <FieldLabel htmlFor="new-project-name">
                Project Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="new-project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onBlur={() => setCreateTouched(true)}
                disabled={isSubmitting}
                required
              />
              <FieldError errors={createError ? [{ message: createError }] : []} />
            </Field>
            <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newProjectName.trim()}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
              >
                Create Project
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameProject} onOpenChange={(open) => !open && setRenameProject(null)}>
        <DialogContent className="max-w-[400px] w-full rounded-2xl bg-white border border-slate-200/60 shadow-xl font-sans p-6 select-none">
          <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-semibold text-slate-900">Rename Project</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Update the name of your project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-4">
            <Field>
              <FieldLabel htmlFor="rename-project-name">
                New Project Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="rename-project-name"
                placeholder="Enter new name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => setRenameTouched(true)}
                disabled={isSubmitting}
                required
              />
              <FieldError errors={renameError ? [{ message: renameError }] : []} />
            </Field>
            <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRenameProject(null)}
                disabled={isSubmitting}
                className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !renameValue.trim()}
                className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
              >
                Save Changes
              </button>
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

      {canTopUp && (
        <ProjectTopUpDialog
          project={selectedTopUpProject}
          open={!!selectedTopUpProject}
          onOpenChange={(open) => !open && setSelectedTopUpProject(null)}
          onSuccess={() => {
            pushToast("Credits topped up successfully.", "success");
            reloadData();
          }}
          onTopUp={(id, amount, description) => topUpProjectCredits(id, amount, description, undefined, userContext)}
        />
      )}
    </ManagerShell>
  );
}
