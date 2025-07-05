
// Room-based task storage with user management
let currentRoomId = localStorage.getItem('currentRoomId') || null;
let tasks = {};
let teamMembers = [];
let currentUser = localStorage.getItem('currentUser') || 'Anonymous';
let viewFilter = 'all'; // 'all', 'my-tasks', 'assigned-by-me'
let taskIdCounter = 0;

// Initialize room data
function initializeRoom() {
    if (currentRoomId) {
        tasks = JSON.parse(localStorage.getItem(`tasks_${currentRoomId}`)) || {
            today: [],
            week: [],
            month: []
        };
        teamMembers = JSON.parse(localStorage.getItem(`teamMembers_${currentRoomId}`)) || ['You'];
        taskIdCounter = parseInt(localStorage.getItem(`taskIdCounter_${currentRoomId}`)) || 0;
    }
}

// Save room data to localStorage
function saveRoomData() {
    if (!currentRoomId) return;
    
    localStorage.setItem(`tasks_${currentRoomId}`, JSON.stringify(tasks));
    localStorage.setItem(`teamMembers_${currentRoomId}`, JSON.stringify(teamMembers));
    localStorage.setItem(`taskIdCounter_${currentRoomId}`, taskIdCounter.toString());
    localStorage.setItem('currentRoomId', currentRoomId);
    localStorage.setItem('currentUser', currentUser);
}

// Generate random room ID
function generateRoomId() {
    const adjectives = ['amazing', 'brilliant', 'creative', 'dynamic', 'efficient', 'fantastic', 'great', 'innovative'];
    const nouns = ['team', 'squad', 'crew', 'group', 'project', 'workspace', 'hub', 'zone'];
    const randomNum = Math.floor(Math.random() * 1000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}-${noun}-${randomNum}`;
}

// Create new room
function createNewRoom() {
    const newRoomId = generateRoomId();
    currentRoomId = newRoomId;
    
    // Initialize fresh data for new room
    tasks = {
        today: [],
        week: [],
        month: []
    };
    teamMembers = [currentUser === 'Anonymous' ? 'You' : currentUser];
    taskIdCounter = 0;
    
    saveRoomData();
    showTaskManager();
}

// Join existing room
function joinRoom() {
    const input = document.getElementById('room-id-input');
    const roomId = input.value.trim();
    
    if (roomId === '') {
        alert('Please enter a Room ID!');
        return;
    }
    
    // Check if room exists (has data)
    const existingTasks = localStorage.getItem(`tasks_${roomId}`);
    
    currentRoomId = roomId;
    
    if (existingTasks) {
        // Room exists, load existing data
        initializeRoom();
        
        // Add current user to team if not already present
        if (currentUser !== 'Anonymous' && !teamMembers.includes(currentUser)) {
            teamMembers.push(currentUser);
            saveRoomData();
        }
    } else {
        // New room, initialize with fresh data
        tasks = {
            today: [],
            week: [],
            month: []
        };
        teamMembers = [currentUser === 'Anonymous' ? 'You' : currentUser];
        taskIdCounter = 0;
        saveRoomData();
    }
    
    input.value = '';
    showTaskManager();
}

// Leave current room
function leaveRoom() {
    if (confirm('Are you sure you want to leave this room? You will lose access to the current tasks.')) {
        currentRoomId = null;
        localStorage.removeItem('currentRoomId');
        showRoomSelection();
    }
}

// Show room selection page
function showRoomSelection() {
    document.getElementById('room-selection').classList.remove('hidden');
    document.getElementById('task-manager').classList.add('hidden');
    
    if (currentRoomId) {
        document.getElementById('current-room-display').classList.remove('hidden');
        document.getElementById('current-room-id').textContent = currentRoomId;
    } else {
        document.getElementById('current-room-display').classList.add('hidden');
    }
}

// Show task manager
function showTaskManager() {
    document.getElementById('room-selection').classList.add('hidden');
    document.getElementById('task-manager').classList.remove('hidden');
    document.getElementById('room-display').textContent = currentRoomId;
    updateUI();
}

// Set current user
function setCurrentUser() {
    const input = document.getElementById('user-name-input');
    const name = input.value.trim();
    
    if (name === '') {
        alert('Please enter a name!');
        return;
    }
    
    currentUser = name;
    if (!teamMembers.includes(name)) {
        teamMembers.push(name);
    }
    
    input.value = '';
    updateUI();
    saveRoomData();
}

// Add team member
function addTeamMember() {
    const input = document.getElementById('new-member-input');
    const name = input.value.trim();
    
    if (name === '') {
        alert('Please enter a member name!');
        return;
    }
    
    if (teamMembers.includes(name)) {
        alert('This member already exists!');
        return;
    }
    
    teamMembers.push(name);
    input.value = '';
    updateUI();
    saveRoomData();
}

// Remove team member
function removeTeamMember(memberName) {
    if (memberName === currentUser) {
        alert("You can't remove yourself!");
        return;
    }
    
    if (confirm(`Remove ${memberName} from the team?`)) {
        teamMembers = teamMembers.filter(m => m !== memberName);
        updateUI();
        saveRoomData();
    }
}

// Update UI elements
function updateUI() {
    updateCurrentUserDisplay();
    updateTeamMembersDisplay();
    updateAssigneeDropdowns();
    renderAllTasks();
}

// Update current user display
function updateCurrentUserDisplay() {
    document.getElementById('current-user-name').textContent = currentUser;
}

// Update team members display
function updateTeamMembersDisplay() {
    const container = document.getElementById('team-members');
    container.innerHTML = teamMembers.map(member => `
        <div class="member-tag ${member === currentUser ? 'active' : ''}" 
             onclick="switchUser('${member}')" 
             oncontextmenu="removeTeamMember('${member}'); return false;">
            ${member} ${member === currentUser ? '(You)' : ''}
        </div>
    `).join('');
}

// Switch current user
function switchUser(memberName) {
    currentUser = memberName;
    updateUI();
    saveRoomData();
}

// Update assignee dropdowns
function updateAssigneeDropdowns() {
    ['today', 'week', 'month'].forEach(section => {
        const select = document.getElementById(`${section}-assignee`);
        select.innerHTML = '<option value="">Assign to...</option>' +
            teamMembers.map(member => `<option value="${member}">${member}</option>`).join('');
    });
}

// Set view filter
function setViewFilter(filter) {
    viewFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderAllTasks();
}

// Filter tasks based on current view
function filterTasks(sectionTasks) {
    switch(viewFilter) {
        case 'my-tasks':
            return sectionTasks.filter(task => task.assignee === currentUser);
        case 'assigned-by-me':
            return sectionTasks.filter(task => task.assigner === currentUser);
        default:
            return sectionTasks;
    }
}

// Add task function
function addTask(section) {
    const input = document.getElementById(`${section}-input`);
    const assigneeSelect = document.getElementById(`${section}-assignee`);
    const taskText = input.value.trim();
    const assignee = assigneeSelect.value || currentUser;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: ++taskIdCounter,
        text: taskText,
        assignee: assignee,
        assigner: currentUser,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks[section].push(task);
    input.value = '';
    assigneeSelect.value = '';
    renderTasks(section);
    updateTaskCount(section);
    saveRoomData();
}

// Render tasks for a section
function renderTasks(section) {
    const container = document.getElementById(`${section}-tasks`);
    const sectionTasks = filterTasks(tasks[section]);

    if (sectionTasks.length === 0) {
        const emptyMessage = viewFilter === 'all' 
            ? `No tasks for ${section === 'today' ? 'today' : section === 'week' ? 'this week' : 'this month'}. Add one above!`
            : `No ${viewFilter.replace('-', ' ')} for ${section === 'today' ? 'today' : section === 'week' ? 'this week' : 'this month'}.`;
        container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
        return;
    }

    container.innerHTML = sectionTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${section}', ${task.id})">
            <div class="task-content">
                <div class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-assignee">👤 ${task.assignee}</span>
                    <span class="task-assigner">📝 by ${task.assigner}</span>
                    <span>📅 ${new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTask('${section}', ${task.id})">Delete</button>
        </div>
    `).join('');
}

// Render all tasks
function renderAllTasks() {
    ['today', 'week', 'month'].forEach(section => {
        renderTasks(section);
        updateTaskCount(section);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle task completion
function toggleTask(section, taskId) {
    const task = tasks[section].find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks(section);
        updateTaskCount(section);
        saveRoomData();
    }
}

// Delete task
function deleteTask(section, taskId) {
    const task = tasks[section].find(t => t.id === taskId);
    if (!task) return;
    
    // Only allow deletion if user is the assigner or assignee
    if (task.assigner !== currentUser && task.assignee !== currentUser) {
        alert('You can only delete tasks assigned to you or by you.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this task?')) {
        tasks[section] = tasks[section].filter(t => t.id !== taskId);
        renderTasks(section);
        updateTaskCount(section);
        saveRoomData();
    }
}

// Update task count
function updateTaskCount(section) {
    const allTasks = tasks[section];
    const filteredTasks = filterTasks(allTasks);
    const completedCount = filteredTasks.filter(t => t.completed).length;
    const countElement = document.getElementById(`${section}-count`);

    if (filteredTasks.length === 0) {
        countElement.textContent = viewFilter === 'all' ? '0 tasks' : `0 ${viewFilter.replace('-', ' ')}`;
    } else {
        const taskType = viewFilter === 'all' ? 'task' : viewFilter.replace('-', ' ').slice(0, -1);
        countElement.textContent = `${filteredTasks.length} ${taskType}${filteredTasks.length !== 1 ? 's' : ''} (${completedCount} completed)`;
    }
}

// Export tasks as JSON
function exportTasks() {
    const exportData = {
        roomId: currentRoomId,
        tasks: tasks,
        teamMembers: teamMembers,
        currentUser: currentUser,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-tasks-${currentRoomId}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Clear all completed tasks
function clearCompleted(section) {
    if (confirm('Remove all completed tasks?')) {
        tasks[section] = tasks[section].filter(t => !t.completed);
        renderTasks(section);
        updateTaskCount(section);
        saveRoomData();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already in a room
    if (currentRoomId) {
        initializeRoom();
        showTaskManager();
    } else {
        showRoomSelection();
    }

    // Add Enter key support for room input
    document.getElementById('room-id-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinRoom();
        }
    });

    // Add Enter key support for task inputs
    ['today', 'week', 'month'].forEach(section => {
        const input = document.getElementById(`${section}-input`);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTask(section);
            }
        });
    });

    // Add Enter key support for user inputs
    document.getElementById('user-name-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            setCurrentUser();
        }
    });

    document.getElementById('new-member-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTeamMember();
        }
    });

    // Add export button when in task manager
    setTimeout(() => {
        if (!document.getElementById('export-btn') && currentRoomId) {
            const header = document.querySelector('.header');
            const exportBtn = document.createElement('button');
            exportBtn.id = 'export-btn';
            exportBtn.innerHTML = '📥 Export Room Tasks';
            exportBtn.className = 'add-btn';
            exportBtn.style.marginTop = '10px';
            exportBtn.onclick = exportTasks;
            header.appendChild(exportBtn);
        }
    }, 100);
});
