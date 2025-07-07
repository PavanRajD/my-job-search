import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useResume } from "../../contexts/ResumeContext";

const ExperienceManager: React.FC = () => {
  const [newExperience, setNewExperience] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { experiences, addExperience, removeExperience, isLoading } =
    useResume();
  const { toast } = useToast();

  const handleAddExperience = async () => {
    if (!newExperience.trim()) {
      toast({
        title: "Please enter an experience",
        description: "Experience content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    const success = await addExperience(newExperience.trim());

    if (success) {
      setNewExperience("");
      toast({
        title: "✅ Experience Added",
        description: "Your experience has been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add experience. Please try again.",
        variant: "destructive",
      });
    }
    setIsAdding(false);
  };

  const handleRemoveExperience = async (experienceKey: string) => {
    const success = await removeExperience(experienceKey);

    if (success) {
      toast({
        title: "✅ Experience Removed",
        description: "The experience has been deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove experience. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (key: string, content: string) => {
    setEditingKey(key);
    setEditingContent(content);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditingContent("");
  };

  const saveEdit = async () => {
    if (!editingContent.trim() || !editingKey) return;

    // Remove old and add new (simple approach)
    const removeSuccess = await removeExperience(editingKey);
    if (removeSuccess) {
      const addSuccess = await addExperience(editingContent.trim());
      if (addSuccess) {
        toast({
          title: "✅ Experience Updated",
          description: "Your experience has been updated successfully.",
        });
        cancelEditing();
      }
    }
  };

  const experienceEntries = Object.entries(experiences);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Loading experiences...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Additional Experiences
        </CardTitle>
        <CardDescription>
          Add behavioral examples, work stories, and achievements that can be
          used to personalize your interview answers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Experience */}
        <div className="space-y-3">
          <Textarea
            placeholder="Describe a work experience, achievement, challenge you overcame, or any story that demonstrates your skills... For example: 'Led a cross-functional team to deliver a critical project 2 weeks ahead of schedule by implementing agile methodologies and daily standups, resulting in 25% faster delivery and improved team communication.'"
            value={newExperience}
            onChange={(e) => setNewExperience(e.target.value)}
            className="min-h-[120px]"
          />
          <Button
            onClick={handleAddExperience}
            disabled={!newExperience.trim() || isAdding}
            className="w-full"
          >
            {isAdding ? "Adding..." : "Add Experience"}
          </Button>
        </div>

        {/* Existing Experiences */}
        {experienceEntries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Your Experiences</h4>
              <Badge variant="secondary">
                {experienceEntries.length} experience
                {experienceEntries.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="space-y-3">
              {experienceEntries.map(([key, content]) => (
                <div key={key} className="p-4 border rounded-lg bg-gray-50">
                  {editingKey === key ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {content}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(key, content)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveExperience(key)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {experienceEntries.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No experiences added yet.</p>
            <p className="text-xs mt-1">
              Add your first experience above to get started with personalized
              answers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperienceManager;
