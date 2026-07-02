// Sistema de Upload de Imagens
class ImageManager {
    constructor() {
        this.images = this.loadImages();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setupDropZone();
        this.setupForm();
        this.setupFilters();
        this.renderGallery();
    }

    // Carregar imagens do localStorage
    loadImages() {
        const saved = localStorage.getItem('galleryImages');
        return saved ? JSON.parse(saved) : [];
    }

    // Salvar imagens no localStorage
    saveImages() {
        localStorage.setItem('galleryImages', JSON.stringify(this.images));
    }

    // Configurar zona de drag and drop
    setupDropZone() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('imageFile');

        // Click para selecionar arquivo
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Seleção de arquivo
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Processar arquivo selecionado
    handleFileSelect(file) {
        if (!file) return;

        // Validar tipo
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Formato de imagem não suportado. Use JPG, PNG, GIF ou WEBP.');
            return;
        }

        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem excede o limite de 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <span class="preview-info">${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
            `;
        };
        reader.readAsDataURL(file);
    }

    // Configurar formulário
    setupForm() {
        const form = document.getElementById('uploadForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadImage();
        });
    }

    // Upload da imagem
    uploadImage() {
        const title = document.getElementById('imageTitle').value;
        const category = document.getElementById('imageCategory').value;
        const fileInput = document.getElementById('imageFile');
        const file = fileInput.files[0];

        if (!file) {
            alert('Selecione uma imagem para fazer upload.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newImage = {
                id: Date.now(),
                title: title,
                category: category,
                data: e.target.result,
                name: file.name,
                size: file.size,
                uploadDate: new Date().toLocaleDateString('pt-BR'),
                views: 0
            };

            this.images.unshift(newImage);
            this.saveImages();
            this.renderGallery();
            
            // Limpar formulário
            document.getElementById('uploadForm').reset();
            document.getElementById('imagePreview').innerHTML = `
                <i class="fas fa-image"></i>
                <p>Nenhuma imagem selecionada</p>
            `;

            alert('✅ Imagem cadastrada com sucesso!');
        };
        reader.readAsDataURL(file);
    }

    // Configurar filtros
    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderGallery();
            });
        });
    }

    // Renderizar galeria
    renderGallery() {
        const gallery = document.getElementById('imageGallery');
        
        let filteredImages = this.images;
        if (this.currentFilter !== 'all') {
            filteredImages = this.images.filter(img => img.category === this.currentFilter);
        }

        if (filteredImages.length === 0) {
            gallery.innerHTML = `
                <div class="empty-gallery">
                    <i class="fas fa-images"></i>
                    <h3>Nenhuma imagem cadastrada</h3>
                    <p>Faça o upload da primeira imagem</p>
                </div>
            `;
            return;
        }

        gallery.innerHTML = filteredImages.map(img => `
            <div class="admin-image-card" data-id="${img.id}">
                <div class="admin-image-wrapper">
                    <img src="${img.data}" alt="${img.title}">
                    <div class="admin-image-overlay">
                        <button onclick="imageManager.deleteImage(${img.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="admin-image-info">
                    <h4>${img.title}</h4>
                    <div class="admin-image-tags">
                        <span class="category-tag">${img.category}</span>
                        <span class="date-tag"><i class="far fa-calendar"></i> ${img.uploadDate}</span>
                    </div>
                    <div class="admin-image-actions">
                        <button onclick="imageManager.copyImage('${img.data}')" class="action-btn">
                            <i class="fas fa-copy"></i> Copiar URL
                        </button>
                        <button onclick="imageManager.downloadImage('${img.data}', '${img.title}')" class="action-btn">
                            <i class="fas fa-download"></i> Baixar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Deletar imagem
    deleteImage(id) {
        if (confirm('Tem certeza que deseja excluir esta imagem?')) {
            this.images = this.images.filter(img => img.id !== id);
            this.saveImages();
            this.renderGallery();
        }
    }

    // Copiar imagem como URL
    copyImage(data) {
        // Criar blob da imagem
        fetch(data)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                navigator.clipboard.writeText(url).then(() => {
                    alert('URL da imagem copiada para a área de transferência!');
                });
            });
    }

    // Baixar imagem
    downloadImage(data, title) {
        const link = document.createElement('a');
        link.href = data;
        link.download = `${title.replace(/\s/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Usar imagem no site
    useImage(data) {
        // Esta função pode ser expandida para inserir a imagem em outras partes do site
        alert('Imagem selecionada para uso!');
    }
}

// Inicializar o gerenciador
const imageManager = new ImageManager();

// Expor funções globalmente
window.imageManager = imageManager;