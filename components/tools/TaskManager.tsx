import React, { useState, useEffect } from 'react';
import ToolHeader from '../ToolHeader';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

const TaskManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Load tasks from localStorage on initial render
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error)      {
      console.error("Failed to save tasks to localStorage", error);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() === '') return;
    const newTask: Task = {
      id: Date.now(),
      text: inputText,
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setInputText('');
  };

  const handleToggleComplete = (id: number) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleStartEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const handleSaveEdit = (id: number) => {
    if (editingText.trim() === '') {
        handleDeleteTask(id);
    } else {
        setTasks(
          tasks.map(task =>
            task.id === id ? { ...task, text: editingText } : task
          )
        );
    }
    setEditingTaskId(null);
    setEditingText('');
  };
  
  const handleCancelEditing = () => {
      setEditingTaskId(null);
      setEditingText('');
  }

  const handleClearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <div>
      <ToolHeader title="إدارة المهام" onBack={onBack} />
      <div className="neumorphic-outset p-6">
        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex items-center gap-3 mb-6">
          <div className="flex-grow neumorphic-inset flex items-center p-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="أضف مهمة جديدة..."
              className="w-full bg-transparent p-2 focus:outline-none text-base-text"
            />
          </div>
          <button type="submit" className="neumorphic-button bg-primary text-white font-bold py-3 px-6">
            إضافة
          </button>
        </form>

        {/* Filters and Actions */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <div className="flex p-1 rounded-xl neumorphic-inset">
             <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl transition-all duration-300 ${filter === 'all' ? 'neumorphic-button active bg-primary text-white' : 'text-base-text'}`}>الكل</button>
             <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-xl transition-all duration-300 ${filter === 'active' ? 'neumorphic-button active bg-primary text-white' : 'text-base-text'}`}>النشطة</button>
             <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-xl transition-all duration-300 ${filter === 'completed' ? 'neumorphic-button active bg-primary text-white' : 'text-base-text'}`}>المكتملة</button>
          </div>
          {completedCount > 0 && (
            <button onClick={handleClearCompleted} className="neumorphic-button bg-secondary text-white text-sm py-2 px-4">
              حذف المكتمل <span className="bg-white/20 text-xs rounded-full px-2 py-0.5 ml-2">{completedCount}</span>
            </button>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className="neumorphic-inset p-3 flex items-center gap-3 transition-opacity duration-300">
                {editingTaskId === task.id ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                      className="w-full bg-transparent p-1 focus:outline-none text-base-text border-b-2 border-primary"
                      autoFocus
                    />
                    <button onClick={() => handleSaveEdit(task.id)} className="neumorphic-button w-10 h-10 flex-shrink-0 flex items-center justify-center bg-secondary text-white">
                        <i className="fas fa-save"></i>
                    </button>
                    <button onClick={handleCancelEditing} className="neumorphic-button w-10 h-10 flex-shrink-0 flex items-center justify-center">
                        <i className="fas fa-times text-icon"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task.id)}
                    />
                    <span className={`flex-grow text-base-text ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.text}
                    </span>
                    <button onClick={() => handleStartEditing(task)} className="neumorphic-button w-10 h-10 flex-shrink-0 flex items-center justify-center">
                        <i className="fas fa-pencil-alt text-icon"></i>
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="neumorphic-button w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-500 text-white">
                        <i className="fas fa-trash"></i>
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-text/70">
                <i className="fas fa-check-circle text-4xl mb-3"></i>
                <p>{filter === 'completed' ? 'لا توجد مهام مكتملة.' : 'رائع! لا توجد مهام حالياً.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;