// Global variables
let token = localStorage.getItem('nityar_token');
const apiBaseUrl = '/api';

// Check if user is logged in
function checkAuth() {
    if (!token) {
        // Redirect to login if no token is found
        window.location.href = '/static/login.html';
    }
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch(`${apiBaseUrl}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'username': username,
                'password': password,
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save token and redirect
            localStorage.setItem('nityar_token', data.access_token);
            window.location.href = '/';
        } else {
            // Show error message
            alert('Login failed: ' + (data.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('nityar_token');
    window.location.href = '/static/login.html';
}

// File listing function
async function listFiles() {
    try {
        const response = await fetch(`${apiBaseUrl}/files/list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }
        
        const data = await response.json();
        
        // Display files
        const fileList = document.getElementById('file-list');
        if (fileList) {
            fileList.innerHTML = '';
            
            if (data.files.length === 0) {
                fileList.innerHTML = '<tr><td colspan="4" class="text-center">No files found</td></tr>';
                return;
            }
            
            data.files.forEach(file => {
                const row = document.createElement('tr');
                
                // Format file size
                const fileSize = formatFileSize(file.size);
                
                // Format modified date
                const modified = new Date(file.modified).toLocaleString();
                
                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>${fileSize}</td>
                    <td>${modified}</td>
                    <td>
                        <button onclick="downloadFile('${file.name}')" class="btn btn-sm btn-accent">Download</button>
                        <button onclick="deleteFile('${file.name}')" class="btn btn-sm btn-outline">Delete</button>
                    </td>
                `;
                fileList.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error listing files:', error);
        alert('Failed to list files: ' + error.message);
    }
}

// File upload function
async function uploadFile(formData) {
    try {
        const response = await fetch(`${apiBaseUrl}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }
        
        const result = await response.json();
        
        if (response.ok) {
            // Refresh file list
            listFiles();
            return result;
        } else {
            throw new Error(result.detail || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
    }
}

// File download function
function downloadFile(filename) {
    window.location.href = `${apiBaseUrl}/files/download/${filename}?token=${token}`;
}

// File delete function
async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${apiBaseUrl}/files/${filename}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }
        
        if (response.ok) {
            // Refresh file list
            listFiles();
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Delete failed: ' + error.message);
    }
}

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            login(username, password);
        });
    }
    
    // File upload form handling
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('file-input');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                uploadFile(formData);
                fileInput.value = '';
            } else {
                alert('Please select a file to upload');
            }
        });
    }
    
    // Logout button handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // Load files if on cloud page
    if (document.getElementById('file-list')) {
        checkAuth();
        listFiles();
    }
});
