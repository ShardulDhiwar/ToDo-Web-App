
// Real-time collaborative task storage
let socket;
let currentRoomId = null;
let tasks = {};
let teamMembers = [];
let currentUser = 'Anonymous';
let viewFilter = 'all';
let taskIdCounter = 0;
let isConnected = false;

// Initialize Socket.IO connection
function initializeSocket() {
    // Connect to the server (will work on Replit deployment)
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        isConnected = true;
        updateConnectionStatus();
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        isConnected = false;
        updateConnectionStatus();
    });
    
    // Room events
    socket.on('room-joined', (data) => {
        tasks = data.tasks;
        teamMembers = data.teamMembers;
        taskIdCounter = data.taskIdCounter;
        updateUI();
    });
    
    socket.on('room-updated', (data) => {
        tasks = data.tasks;
        teamMembers = data.teamMembers;
        taskIdCounter = data.taskIdCounter;
        updateUI();
    });
    
    socket.on('user-joined', (data) => {
        teamMembers = data.teamMembers;
        updateTeamMembersDisplay();
        showNotification(`${data.user} joined the room`);
    });
    
    socket.on('user-left', (data) => {
        teamMembers = data.teamMembers;
        updateTeamMembersDisplay();
        showNotification(`${data.user} left the room`);
    });
    
    socket.on('task-added', (data) => {
        tasks = data.tasks;
        taskIdCounter = data.taskIdCounter;
        renderAllTasks();
        showNotification(`New task added by ${data.user}`);
    });
    
    socket.on('task-updated', (data) => {
        tasks = data.tasks;
        renderAllTasks();
    });
    
    socket.on('error', (error) => {
        alert(`Error: ${error.message}`);
    });
}

// Update connection status indicator
function updateConnectionStatus() {
    let indicator = document.getElementById('connection-status');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    if (isConnected) {
        indicator.textContent = '🟢 Connected';
        indicator.style.background = '#d4edda';
        indicator.style.color = '#155724';
    } else {
        indicator.textContent = '🔴 Disconnected';
        indicator.style.background = '#f8d7da';
        indicator.style.color = '#721c24';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: #667eea;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
    if (!isConnected) {
        alert('Not connected to server. Please wait and try again.');
        return;
    }
    
    const newRoomId = generateRoomId();
    currentRoomId = newRoomId;
    
    socket.emit('create-room', {
        roomId: newRoomId,
        user: currentUser
    });
    
    showTaskManager();
}

// Join existing room
function joinRoom() {
    if (!isConnected) {
        alert('Not connected to server. Please wait and try again.');
        return;
    }
    
    const input = document.getElementById('room-id-input');
    const roomId = input.value.trim();
    
    if (roomId === '') {
        alert('Please enter a Room ID!');
        return;
    }
    
    currentRoomId = roomId;
    
    socket.emit('join-room', {
        roomId: roomId,
        user: currentUser
    });
    
    input.value = '';
    showTaskManager();
}

// Leave current room
function leaveRoom() {
    if (confirm('Are you sure you want to leave this room?')) {
        if (socket && currentRoomId) {
            socket.emit('leave-room', {
                roomId: currentRoomId,
                user: currentUser
            });
        }
        currentRoomId = null;
        showRoomSelection();
    }
}

// Show room selection page
function showRoomSelection() {
    document.getElementById('room-selection').classList.remove('hidden');
    document.getElementById('task-manager').classList.add('hidden');
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
    
    const oldUser = currentUser;
    currentUser = name;
    
    if (socket && currentRoomId) {
        socket.emit('update-user', {
            roomId: currentRoomId,
            oldUser: oldUser,
            newUser: name
        });
    }
    
    input.value = '';
    updateUI();
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
    
    if (socket && currentRoomId) {
        socket.emit('add-member', {
            roomId: currentRoomId,
            memberName: name,
            user: currentUser
        });
    }
    
    input.value = '';
}

// Remove team member
function removeTeamMember(memberName) {
    if (memberName === currentUser) {
        alert("You can't remove yourself!");
        return;
    }
    
    if (confirm(`Remove ${memberName} from the team?`)) {
        if (socket && currentRoomId) {
            socket.emit('remove-member', {
                roomId: currentRoomId,
                memberName: memberName,
                user: currentUser
            });
        }
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
    if (!isConnected || !currentRoomId) {
        alert('Not connected to room. Please join a room first.');
        return;
    }
    
    const input = document.getElementById(`${section}-input`);
    const assigneeSelect = document.getElementById(`${section}-assignee`);
    const taskText = input.value.trim();
    const assignee = assigneeSelect.value || currentUser;

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        text: taskText,
        assignee: assignee,
        assigner: currentUser,
        completed: false,
        createdAt: new Date().toISOString()
    };

    socket.emit('add-task', {
        roomId: currentRoomId,
        section: section,
        task: task,
        user: currentUser
    });

    input.value = '';
    assigneeSelect.value = '';
}

// Render tasks for a section
function renderTasks(section) {
    const container = document.getElementById(`${section}-tasks`);
    const sectionTasks = filterTasks(tasks[section] || []);

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
    if (!socket || !currentRoomId) return;
    
    socket.emit('toggle-task', {
        roomId: currentRoomId,
        section: section,
        taskId: taskId,
        user: currentUser
    });
}

// Delete task
function deleteTask(section, taskId) {
    if (!socket || !currentRoomId) return;
    
    const task = (tasks[section] || []).find(t => t.id === taskId);
    if (!task) return;
    
    // Only allow deletion if user is the assigner or assignee
    if (task.assigner !== currentUser && task.assignee !== currentUser) {
        alert('You can only delete tasks assigned to you or by you.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this task?')) {
        socket.emit('delete-task', {
            roomId: currentRoomId,
            section: section,
            taskId: taskId,
            user: currentUser
        });
    }
}

// Update task count
function updateTaskCount(section) {
    const allTasks = tasks[section] || [];
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO connection
    initializeSocket();
    
    // Show room selection by default
    showRoomSelection();

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
});
