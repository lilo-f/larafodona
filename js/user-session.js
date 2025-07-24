class UserSession {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('ravenStudioCurrentUser')) || null;
        this.initializeAdminUser();
    }

    initializeAdminUser() {
        const users = JSON.parse(localStorage.getItem('ravenStudioUsers')) || [];
        const adminExists = users.some(user => user.role === 'admin');
        
        if (!adminExists) {
            const defaultAdmin = {
                id: 'admin_' + Date.now(),
                name: "Admin Raven",
                email: "admin@ravenstudio.com",
                password: "admin123", // EM PRODUÇÃO, SUBSTITUIR POR HASH!
                role: "admin",
                avatar: "/img/avatars/admin.png",
                createdAt: new Date().toISOString(),
                appointments: [],
                wishlist: [],
                isAdmin: true
            };
            
            users.push(defaultAdmin);
            localStorage.setItem('ravenStudioUsers', JSON.stringify(users));
        }
    }

    // Verifica se há um usuário logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Realiza o login do usuário
    login(userData) {
        this.currentUser = userData;
        localStorage.setItem('ravenStudioCurrentUser', JSON.stringify(userData));
        
        // Redireciona baseado no tipo de usuário
        if (this.isAdmin()) {
            setTimeout(() => window.location.href = 'adm.html', 300);
        } else {
            setTimeout(() => window.location.href = 'user.html', 300);
        }
    }

    // Realiza o logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('ravenStudioCurrentUser');
        window.location.href = 'login.html';
    }

    // Verifica se o usuário é administrador
    isAdmin() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.isAdmin);
    }

    // Obtém a lista de desejos do usuário
    getWishlist() {
        return this.currentUser?.wishlist || [];
    }

    // Adiciona um item à lista de desejos
    addToWishlist(productId) {
        if (!this.currentUser) return false;
        
        if (!this.currentUser.wishlist) {
            this.currentUser.wishlist = [];
        }
        
        if (!this.currentUser.wishlist.includes(productId)) {
            this.currentUser.wishlist.push(productId);
            this.updateUserData();
            return true;
        }
        return false;
    }

    // Remove um item da lista de desejos
    removeFromWishlist(productId) {
        if (!this.currentUser || !this.currentUser.wishlist) return false;
        
        const index = this.currentUser.wishlist.indexOf(productId);
        if (index !== -1) {
            this.currentUser.wishlist.splice(index, 1);
            this.updateUserData();
            return true;
        }
        return false;
    }

    // Atualiza os dados do usuário no localStorage
    updateUserData() {
        if (!this.currentUser) return;
        
        // Atualiza no localStorage
        localStorage.setItem('ravenStudioCurrentUser', JSON.stringify(this.currentUser));
        
        // Atualiza na lista de usuários
        const users = JSON.parse(localStorage.getItem('ravenStudioUsers')) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('ravenStudioUsers', JSON.stringify(users));
        }
    }

    // Obtém todos os agendamentos do usuário
    getAppointments() {
        return this.currentUser?.appointments || [];
    }

    // Adiciona um novo agendamento
    addAppointment(appointmentData) {
        if (!this.currentUser) return false;
        
        if (!this.currentUser.appointments) {
            this.currentUser.appointments = [];
        }
        
        appointmentData.id = 'appt_' + Date.now();
        appointmentData.status = 'pending';
        this.currentUser.appointments.push(appointmentData);
        this.updateUserData();
        
        // Atualiza também no localStorage de agendamentos global
        const allAppointments = JSON.parse(localStorage.getItem('ravenStudioAppointments')) || [];
        allAppointments.push(appointmentData);
        localStorage.setItem('ravenStudioAppointments', JSON.stringify(allAppointments));
        
        return true;
    }

    // Métodos específicos para administradores
    // Obtém todos os usuários (apenas para admin)
    getAllUsers() {
        if (!this.isAdmin()) return [];
        return JSON.parse(localStorage.getItem('ravenStudioUsers')) || [];
    }

    // Obtém todos os agendamentos (apenas para admin)
    getAllAppointments() {
        if (!this.isAdmin()) return [];
        return JSON.parse(localStorage.getItem('ravenStudioAppointments')) || [];
    }

    // Atualiza status de um agendamento (apenas para admin)
    updateAppointmentStatus(appointmentId, newStatus) {
        if (!this.isAdmin()) return false;
        
        // Atualiza no array global de agendamentos
        const allAppointments = JSON.parse(localStorage.getItem('ravenStudioAppointments')) || [];
        const appointmentIndex = allAppointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            allAppointments[appointmentIndex].status = newStatus;
            localStorage.setItem('ravenStudioAppointments', JSON.stringify(allAppointments));
            
            // Atualiza também no usuário específico (se existir)
            const users = JSON.parse(localStorage.getItem('ravenStudioUsers')) || [];
            for (const user of users) {
                if (user.appointments) {
                    const userAppointmentIndex = user.appointments.findIndex(a => a.id === appointmentId);
                    if (userAppointmentIndex !== -1) {
                        user.appointments[userAppointmentIndex].status = newStatus;
                    }
                }
            }
            localStorage.setItem('ravenStudioUsers', JSON.stringify(users));
            
            return true;
        }
        return false;
    }

    // Obtém todos os pedidos (apenas para admin)
    getAllOrders() {
        if (!this.isAdmin()) return [];
        return JSON.parse(localStorage.getItem('ravenStudioOrders')) || [];
    }

    // Atualiza status de um pedido (apenas para admin)
    updateOrderStatus(orderId, newStatus) {
        if (!this.isAdmin()) return false;
        
        const orders = JSON.parse(localStorage.getItem('ravenStudioOrders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            localStorage.setItem('ravenStudioOrders', JSON.stringify(orders));
            return true;
        }
        return false;
    }
}

// Cria uma instância global
window.userSession = new UserSession();

// Verificação de autenticação ao carregar cada página
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Páginas que não requerem autenticação
    const publicPages = ['login.html', 'register.html', 'home.html', 'index.html'];
    
    // Se não é uma página pública e o usuário não está logado, redireciona
    if (!publicPages.includes(currentPage) && !window.userSession.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Se está na página de admin e não é admin, redireciona
    if (currentPage === 'adm.html' && !window.userSession.isAdmin()) {
        window.location.href = 'login.html';
    }
    
    // Se está na página de login e já está logado, redireciona
    if (currentPage === 'login.html' && window.userSession.isLoggedIn()) {
        if (window.userSession.isAdmin()) {
            window.location.href = 'adm.html';
        } else {
            window.location.href = 'user.html';
        }
    }
});