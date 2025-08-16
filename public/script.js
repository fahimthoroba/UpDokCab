document.addEventListener('DOMContentLoaded', function() {
    // Pastikan ID ini sesuai dengan yang ada di index.html
    const halamanDept = document.getElementById('halaman-departemen');
    const halamanMedia = document.getElementById('halaman-media');
    const halamanForm = document.getElementById('halaman-form');
    const halamanLoading = document.getElementById('halaman-loading');
    const tombolKembali = document.getElementById('tombol-kembali');
    
    const formDepartemen = document.getElementById('form-departemen');
    const formTipeMedia = document.getElementById('form-tipe-media');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('file-input');
    const loadingText = document.querySelector('#halaman-loading p');

    let historyStack = [halamanDept];

    function goToPage(halamanTujuan, isBack = false) {
        document.querySelectorAll('.halaman').forEach(h => h.classList.add('hidden'));
        halamanTujuan.classList.remove('hidden');
        
        if (halamanTujuan === halamanDept) {
            tombolKembali.classList.add('hidden');
        } else {
            tombolKembali.classList.remove('hidden');
        }

        if (!isBack) {
            historyStack.push(halamanTujuan);
        }
    }

    // Event listener untuk tombol departemen
    halamanDept.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn')) {
            formDepartemen.value = e.target.getAttribute('data-dept');
            goToPage(halamanMedia);
        }
    });

    // Event listener untuk tombol tipe media
    halamanMedia.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn')) {
            const mediaType = e.target.getAttribute('data-media');
            formTipeMedia.value = mediaType;
            if (mediaType === 'FOTO') {
                fileInput.setAttribute('accept', 'image/*');
            } else if (mediaType === 'VIDEO') {
                fileInput.setAttribute('accept', 'video/*');
            } else {
                fileInput.removeAttribute('accept');
            }
            goToPage(halamanForm);
        }
    });
    
    // Tombol kembali
    tombolKembali.addEventListener('click', function() {
        historyStack.pop(); 
        const halamanSebelumnya = historyStack[historyStack.length - 1];
        if (halamanSebelumnya) {
            goToPage(halamanSebelumnya, true); 
        }
    });

    // LOGIKA UPLOAD DENGAN PRESIGNED URL
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const files = fileInput.files;

        if (files.length === 0) {
            alert('Silakan pilih file terlebih dahulu.');
            return;
        }

        goToPage(halamanLoading);
        let successfulUploads = 0;
        let failedUploads = 0;
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            loadingText.textContent = `Mengunggah file ${i + 1} dari ${totalFiles}: ${file.name}`;
            
            try {
                // 1. Minta URL upload untuk setiap file
                const urlResponse = await fetch('/generate-upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type || 'application/octet-stream',
                        departemen: formData.get('departemen'),
                        tipe_media: formData.get('tipe_media'),
                        kategori: formData.get('kategori')
                    })
                });

                if (!urlResponse.ok) {
                    throw new Error(`Gagal mendapatkan URL upload, status: ${urlResponse.status}`);
                }

                const { uploadUrl } = await urlResponse.json();

                // 2. Upload file langsung ke URL yang didapat dari Google Drive
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Length': file.size },
                    body: file
                });

                if (uploadResponse.ok) {
                    successfulUploads++;
                } else {
                    failedUploads++;
                }
                
            } catch (error) {
                console.error(`Gagal mengunggah file ${file.name}:`, error);
                failedUploads++;
            }
        }

        alert(`Upload selesai!\n\nBerhasil: ${successfulUploads} file\nGagal: ${failedUploads} file`);
        
        historyStack = [halamanDept];
        goToPage(halamanDept);
        uploadForm.reset();
        loadingText.textContent = 'Sedang Mengupload...';
    });
});