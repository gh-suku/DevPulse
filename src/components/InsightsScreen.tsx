import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Star,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  Save
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card = ({ children, className, title, ...props }: CardProps) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-w-0", className)} {...props}>
    {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
    {children}
  </div>
);

export default function InsightsScreen() {
  const { user } = useAuth();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [subtaskCounts, setSubtaskCounts] = useState<Record<string, { total: number; completed: number }>>({});
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeCategory, setNewAttributeCategory] = useState('general');
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAttributes();
      fetchWeeklySummary();
      fetchGoals();
    }
  }, [user]);

  const fetchAttributes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('attributes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttributes(data || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    }
  };

  const fetchWeeklySummary = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setWeeklySummary(data);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const fetchGoals = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setGoals(data || []);
      
      // Fetch subtask counts for each goal
      if (data && data.length > 0) {
        await fetchSubtaskCounts(data.map(g => g.id));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchSubtaskCounts = async (goalIds: string[]) => {
    if (!user || goalIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('goal_id, is_completed')
        .eq('user_id', user.id)
        .in('goal_id', goalIds);

      if (error) throw error;

      // Calculate counts per goal
      const counts: Record<string, { total: number; completed: number }> = {};
      goalIds.forEach(id => {
        counts[id] = { total: 0, completed: 0 };
      });

      data?.forEach(subtask => {
        if (counts[subtask.goal_id]) {
          counts[subtask.goal_id].total++;
          if (subtask.is_completed) {
            counts[subtask.goal_id].completed++;
          }
        }
      });

      setSubtaskCounts(counts);
    } catch (error) {
      console.error('Error fetching subtask counts:', error);
    }
  };

  const handleRating = async (id: string, rating: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('attributes')
        .update({ rating })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAttributes();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const updateAttributeNotes = async (id: string, notes: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('attributes')
        .update({ notes })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAttributes();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const addAttribute = async () => {
    if (!newAttributeName.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('attributes')
        .insert([{
          user_id: user.id,
          name: newAttributeName,
          rating: 0,
          notes: '',
          category: newAttributeCategory
        }])
        .select();

      if (error) throw error;
      
      await fetchAttributes();
      setNewAttributeName('');
      setNewAttributeCategory('general');
      setIsAddingAttribute(false);
    } catch (error: any) {
      console.error('Error adding attribute:', error);
      alert('Failed to add attribute: ' + error.message);
    }
  };

  const deleteAttribute = async (id: string) => {
    if (!user || !confirm('Delete this attribute?')) return;
    try {
      const { error } = await supabase
        .from('attributes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
    }
  };

  const updateAttribute = async (id: string, updates: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('attributes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchAttributes();
      setEditingAttributeId(null);
    } catch (error) {
      console.error('Error updating attribute:', error);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      {/* Weekly Summary Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Summary</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-w-0">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <Card className="bg-emerald-900 text-white border-none p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">AI Weekly Summary</h3>
                <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-emerald-50 leading-relaxed">
                {weeklySummary?.summary_text ? (
                  <p>{weeklySummary.summary_text}</p>
                ) : (
                  <p className="text-emerald-100/70 italic">No weekly summary available yet. Keep logging your activities to generate insights!</p>
                )}
              </div>
            </Card>

            <Card title="Goal-wise Breakdown">
              <div className="space-y-6">
                {goals.map(goal => {
                  const subtaskInfo = subtaskCounts[goal.id] || { total: 0, completed: 0 };
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-700">{goal.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs">
                            {subtaskInfo.completed}/{subtaskInfo.total} subtasks
                          </span>
                          <span className="text-gray-400 font-medium">{goal.progress}%</span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300" 
                          style={{ 
                            width: `${goal.progress}%`, 
                            backgroundColor: goal.color || '#10b981'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <p className="text-center text-gray-400 py-4">No goals yet. Add goals in the Daily Tracker tab.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6 min-w-0">
            <Card title="Key Insights">
              <div className="space-y-4">
                {weeklySummary?.insights && Array.isArray(weeklySummary.insights) && weeklySummary.insights.length > 0 ? (
                  weeklySummary.insights.map((insight: any, idx: number) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border flex gap-4",
                      insight.type === 'positive' ? 'bg-emerald-50 border-emerald-100' :
                      insight.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                      'bg-blue-50 border-blue-100'
                    )}>
                      <div className={cn(
                        "w-10 h-10 text-white rounded-lg flex items-center justify-center shrink-0",
                        insight.type === 'positive' ? 'bg-emerald-500' :
                        insight.type === 'warning' ? 'bg-amber-500' :
                        'bg-blue-500'
                      )}>
                        {insight.type === 'positive' ? <CheckCircle2 className="w-5 h-5" /> :
                         insight.type === 'warning' ? <TrendingDown className="w-5 h-5" /> :
                         <TrendingUp className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-bold",
                          insight.type === 'positive' ? 'text-emerald-900' :
                          insight.type === 'warning' ? 'text-amber-900' :
                          'text-blue-900'
                        )}>{insight.title}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          insight.type === 'positive' ? 'text-emerald-700' :
                          insight.type === 'warning' ? 'text-amber-700' :
                          'text-blue-700'
                        )}>{insight.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No insights available yet. Keep tracking your progress!</p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Export Options">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">PDF</div>
                  <span className="text-xs font-bold text-gray-600">Report</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">CSV</div>
                  <span className="text-xs font-bold text-gray-600">Raw Data</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Attributes Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Attributes</h2>
          <button
            onClick={() => setIsAddingAttribute(!isAddingAttribute)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Attribute
          </button>
        </div>

        {isAddingAttribute && (
          <Card className="mb-4 border-2 border-emerald-200">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900">New Attribute</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Attribute Name (e.g., Accountability)"
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <select
                  value={newAttributeCategory}
                  onChange={(e) => setNewAttributeCategory(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="leadership">Leadership</option>
                  <option value="communication">Communication</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addAttribute}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  Save Attribute
                </button>
                <button
                  onClick={() => setIsAddingAttribute(false)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 min-w-0">
          {attributes.map(attr => (
            <Card key={attr.id} className="flex flex-col gap-4 relative group isolation-isolate min-w-0 overflow-hidden">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button
                  onClick={() => setEditingAttributeId(editingAttributeId === attr.id ? null : attr.id)}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex-shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteAttribute(attr.id)}
                  className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex justify-between items-start">
                {editingAttributeId === attr.id ? (
                  <input
                    type="text"
                    defaultValue={attr.name}
                    onBlur={(e) => updateAttribute(attr.id, { name: e.target.value })}
                    className="font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm flex-1 mr-2"
                  />
                ) : (
                  <h4 className="font-bold text-gray-900">{attr.name}</h4>
                )}
              </div>
              
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRating(attr.id, star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star className={cn("w-5 h-5", star <= attr.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                  </button>
                ))}
              </div>

              <textarea
                className="w-full bg-gray-50 border-none rounded-lg p-3 text-xs text-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                rows={3}
                defaultValue={attr.notes}
                onBlur={(e) => updateAttributeNotes(attr.id, e.target.value)}
                placeholder="Add notes..."
              />
              
              <span className="text-[10px] text-gray-400 uppercase font-medium">{attr.category}</span>
            </Card>
          ))}

          {attributes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No attributes yet. Add your first attribute above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
