"use client";
import { FC, useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { 
  Pencil, 
  Save, 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  Lock, 
  Trash2,
  Plus,
  Zap,
  ArrowRight,
  HelpCircle,
  Check,
  X,
  Factory
} from "lucide-react";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import ItemRecipeSelector from "./ItemRecipeSelector";
import ProductionLineCard from "./ProductionLineCard";
import DependencyTracker from "./DependencyTracker";
import ImportsList from "./ImportsList";
import ExportsList from "./ExportsList";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

interface ProductionLine {
  _id: string;
  itemClassName: string;
  recipeClassName: string;
  targetQuantityPerMinute: number;
  actualQuantityPerMinute?: number;
  buildingCount?: number;
  buildingType?: string;
  powerConsumption?: number;
  efficiency?: number;
  notes?: string;
  active: boolean;
  item?: {
    name: string;
    icon?: string;
    slug: string;
  };
  recipe?: {
    name: string;
    time: number;
    ingredients: Array<{ item: string; amount: number }>;
    products: Array<{ item: string; amount: number }>;
  };
}

interface FactorySectionProps {
  id: string;
  initialName?: string;
  initialTasks?: Task[];
  initialNotes?: Note[];
  onNameChange?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export const FactorySection: FC<FactorySectionProps> = ({ 
  id, 
  initialName = "A new factory",
  initialTasks = [],
  initialNotes = [],
  onNameChange,
  onDelete
}) => {  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSatisfactionDetails, setShowSatisfactionDetails] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
    // Production lines state
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [showProductionSelector, setShowProductionSelector] = useState(false);  const [loadingProductionLines, setLoadingProductionLines] = useState(false);  const [filterItemForProduction, setFilterItemForProduction] = useState<string | undefined>(undefined);  const [importsRefreshTrigger, setImportsRefreshTrigger] = useState(0);
  const [dependencyRefreshTrigger, setDependencyRefreshTrigger] = useState(0);
  const [exportsRefreshTrigger, setExportsRefreshTrigger] = useState(0);

  // Load production lines
  const loadProductionLines = async () => {
    try {
      setLoadingProductionLines(true);
      const response = await fetch(`/api/factories/${id}/production-lines`);
      if (!response.ok) throw new Error('Failed to fetch production lines');
      
      const data = await response.json();
      setProductionLines(data.productionLines || []);
    } catch (error) {
      console.error('Error loading production lines:', error);
    } finally {
      setLoadingProductionLines(false);
    }
  };

  // Add production line
  const handleAddProductionLine = async (data: {
    item: any;
    recipe: any;
    targetQuantityPerMinute: number;
  }) => {
    try {
      const response = await fetch(`/api/factories/${id}/production-lines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemClassName: data.item.className,
          recipeClassName: data.recipe.className,
          targetQuantityPerMinute: data.targetQuantityPerMinute,
        }),
      });

      if (!response.ok) throw new Error('Failed to add production line');      await loadProductionLines(); // Refresh the list
      setShowProductionSelector(false);
      setFilterItemForProduction(undefined); // Clear the filter
      
      // Trigger dependency tracker refresh by updating triggers
      setImportsRefreshTrigger(prev => prev + 1);
      setDependencyRefreshTrigger(prev => prev + 1);
      setExportsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding production line:', error);
    }
  };  // Update production line
  const handleUpdateProductionLine = async (lineId: string, updates: Partial<ProductionLine>) => {
    try {
      const response = await fetch(`/api/factories/${id}/production-lines/${lineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update production line');      await loadProductionLines(); // Refresh the list
      
      // Trigger dependency tracker refresh by updating triggers
      setImportsRefreshTrigger(prev => prev + 1);
      setDependencyRefreshTrigger(prev => prev + 1);
      setExportsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating production line:', error);
    }
  };
  // Delete production line
  const handleDeleteProductionLine = async (lineId: string) => {
    try {
      const response = await fetch(`/api/factories/${id}/production-lines/${lineId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete production line');

      await loadProductionLines(); // Refresh the list
        // Trigger dependency tracker refresh by updating triggers
      setImportsRefreshTrigger(prev => prev + 1);
      setDependencyRefreshTrigger(prev => prev + 1);
      setExportsRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting production line:', error);
    }
  };

  // Update local state when initial data changes
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Load production lines on mount
  useEffect(() => {
    loadProductionLines();
  }, [id]);

  const handleAddTask = async () => {
    if (!newTask.trim() || isAddingTask) return;

    setIsAddingTask(true);
    try {
      const response = await fetch(`/api/factories/${id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newTask.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const task = await response.json();
      setTasks(prev => [...prev, task]);
      setNewTask("");
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/factories/${id}/tasks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, completed }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed } : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/factories/${id}/tasks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || isAddingNote) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/factories/${id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newNote.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      const note = await response.json();
      setNotes(prev => [...prev, note]);
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/factories/${id}/notes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ noteId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };
  const handleNoteKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddNote();
    }
  };

  const handleDeleteFactory = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/factories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete factory");
      }

      onDelete?.(id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting factory:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameSave = async () => {
    if (name.trim() === initialName) {
      setEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/factories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update factory name");
      }

      const updatedFactory = await response.json();
      onNameChange?.(id, updatedFactory.name);
      setEditing(false);
    } catch (error) {
      console.error("Error updating factory name:", error);
      // Reset to original name on error
      setName(initialName);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setName(initialName);
      setEditing(false);
    }
  };
  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mt-8 w-full max-w-6xl mx-auto shadow-lg">
      {/* Title Section with Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-white text-lg">🏭</div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                className="text-xl font-bold bg-neutral-800 text-white border-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                autoFocus
                disabled={isUpdating}
                aria-label="Factory name"
              />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleNameSave}
                disabled={isUpdating}
                className="text-neutral-400 hover:text-white"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {name}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setEditing(true)} 
                disabled={isUpdating}
                className="text-neutral-400 hover:text-white"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </h1>
          )}
        </div>
          {/* Action Buttons */}
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
            aria-label="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-neutral-600 text-neutral-400 hover:bg-neutral-600 hover:text-white transition-colors"
            aria-label="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-neutral-600 text-neutral-400 hover:bg-neutral-600 hover:text-white transition-colors"
            aria-label="Lock/unlock"
          >
            <Lock className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-colors"
            aria-label="Save"
          >
            <Save className="w-4 h-4" />
          </Button>          <Button 
            size="sm" 
            variant="outline" 
            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            aria-label="Delete"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      

      

      

    {/* Bottom Section - Tasks and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-white">📋</div>
            <h3 className="text-white font-semibold">Tasks</h3>
          </div>
          
          {/* Add new task */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New Task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleTaskKeyPress}
              className="bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
              disabled={isAddingTask}
            />
            <Button
              onClick={handleAddTask}
              disabled={!newTask.trim() || isAddingTask}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isAddingTask ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Task list */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 group">
                <Button
                  onClick={() => handleToggleTask(task.id, !task.completed)}
                  variant="ghost"
                  size="sm"
                  className={`p-1 ${
                    task.completed 
                      ? 'text-green-400 hover:text-green-300' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <span 
                  className={`flex-1 text-sm ${
                    task.completed 
                      ? 'text-neutral-400 line-through' 
                      : 'text-white'
                  }`}
                >
                  {task.text}
                </span>
                <Button
                  onClick={() => handleDeleteTask(task.id)}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-neutral-400 text-sm text-center py-4">No tasks yet</p>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-white">📝</div>
            <h3 className="text-white font-semibold">Notes</h3>
          </div>
          
          {/* Add new note */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add some notes!"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleNoteKeyPress}
              className="bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400 focus:ring-2 focus:ring-blue-500"
              disabled={isAddingNote}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAddingNote}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isAddingNote ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Notes list */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 group">
                <span className="flex-1 text-sm text-white break-words">
                  {note.text}
                </span>
                <Button
                  onClick={() => handleDeleteNote(note.id)}
                  variant="ghost"
                  size="sm"
                  className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}            {notes.length === 0 && (
              <p className="text-neutral-400 text-sm text-center py-4">No notes yet</p>
            )}          </div>
        </div>
      </div>

      {/* Production Lines Section */}
      <div className="bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-orange-400" />
            <h3 className="text-white font-semibold text-lg">Production Lines</h3>
          </div>          <Button
            onClick={() => {
              setFilterItemForProduction(undefined);
              setShowProductionSelector(!showProductionSelector);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Production Line
          </Button>
        </div>        {/* Production Selector */}
        {showProductionSelector && (
          <div className="mb-6">
            <ItemRecipeSelector
              onSelectionComplete={handleAddProductionLine}
              className="mb-4"
              filterByItemClass={filterItemForProduction}
            />
            <Button
              variant="outline"
              onClick={() => {
                setShowProductionSelector(false);
                setFilterItemForProduction(undefined);
              }}
              className="mt-2"
            >
              Cancel
            </Button>
          </div>
        )}        {/* Dependency Tracker */}
        <div className="mb-6">          <DependencyTracker
            currentFactoryId={id}
            productionLines={Array.isArray(productionLines) ? productionLines : []}
            refreshTrigger={dependencyRefreshTrigger}            onAddProductionLine={(ingredient: string) => {
              // Set up the selector to show only recipes that produce this ingredient
              setFilterItemForProduction(ingredient);
              setShowProductionSelector(true);
            }}onImportFromFactory={(ingredient: string, factoryId: string) => {
              // Refresh dependency tracker and imports list after import is created
              loadProductionLines();
              setImportsRefreshTrigger(prev => prev + 1); // Trigger imports list refresh
            }}
          />
        </div>        {/* Imports List */}
        <div className="mb-6">          <ImportsList
            factoryId={id}
            refreshTrigger={importsRefreshTrigger}
            onImportDeleted={() => {
              // Refresh dependency tracker when an import is deleted
              loadProductionLines();
            }}
          />
        </div>        {/* Exports List */}
        <div className="mb-6">
          <ExportsList
            factoryId={id}
            refreshTrigger={exportsRefreshTrigger}
          />
        </div>

        {/* Production Lines List */}
        {loadingProductionLines ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-400" />
            <p className="text-neutral-400 mt-2">Loading production lines...</p>
          </div>
        ) : productionLines.length === 0 ? (
          <div className="text-center py-8">
            <Factory className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400">No production lines yet</p>
            <p className="text-neutral-500 text-sm">Add a production line to start planning your factory</p>
          </div>
        ) : (
          <div className="space-y-4">            {productionLines.map((line) => (
              <ProductionLineCard
                key={line._id}
                productionLine={line}
                factoryId={id}
                onUpdate={handleUpdateProductionLine}
                onDelete={handleDeleteProductionLine}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteFactory}
        factoryName={name}
        isDeleting={isDeleting}
      />
    </section>
  );
};
