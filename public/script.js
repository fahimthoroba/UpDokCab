// Kode JavaScript ini SAMA persis dengan versi PHP sebelumnya
document.addEventListener('DOMContentLoaded', function() {
    const halamanDept = document.getElementById('halaman-departemen');
    const halamanMedia = document.getElementById('halaman-media');
    const halamanForm = document.getElementById('halaman-form');
    const halamanLoading = document.getElementById('halaman-loading');
    const tombolKembali = document.getElementById('tombol-kembali');
    const formDepartemen = document.getElementById('form-departemen');
    const formTipeMedia = document.getElementById('form-tipe-media');
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('uploadForm');
    const namaPengaploadInput = document.getElementById('nama_pengapload');
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

    halamanDept.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn')) {
            formDepartemen.value = e.target.getAttribute('data-dept');
            goToPage(halamanMedia);
        }
    });

    halamanMedia.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn')) {
            const media = e.target.getAttribute('data-media');
            formTipeMedia.value = media;
            fileInput.setAttribute('accept', media === 'FOTO' ? 'image/*' : 'video/*');
            goToPage(halamanForm);
        }
    });
    
    tombolKembali.addEventListener('click', function() {
        historyStack.pop(); 
        const halamanSebelumnya = historyStack[historyStack.length - 1];
        if (halamanSebelumnya) {
            goToPage(halamanSebelumnya, true); 
        }
    });

    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        goToPage(halamanLoading);
        const formData = new FormData(this);

        // Kirim data ke backend Node.js di alamat /upload
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            const nama = namaPengaploadInput.value;
            alert(`Matursuwun rekan/rekanita ${nama}, sehat-sehat nggeh, mugi barokah !!\n\nStatus: ${result}`);
            historyStack = [halamanDept];
            goToPage(halamanDept);
            uploadForm.reset();
        })
        .catch(error => {
            alert('Terjadi error saat mengupload. Silakan coba lagi.');
            console.error('Error:', error);
            goToPage(halamanForm);
        });
    });
});