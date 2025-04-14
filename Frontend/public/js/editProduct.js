$(document).ready(function () {
    const fileInput = $('#fileInput');
    const filePreview = $('#filePreview');

    function displayImageFromLink(imageUrl, imageName = 'Initial Image') {
        const fileItem = $('<div>').addClass('file-item');

        const img = $('<img>');
        img.attr('src', imageUrl);
        img.on('error', function () {
            fileItem.remove();
            console.error(`Failed to load image: ${imageUrl}`);
            handleNoFileScenario();
        });
        fileItem.append(img);

        const info = $('<p>').text(`Name: ${imageName}`);
        fileItem.append(info);

        filePreview.append(fileItem);
        filePreview.css('display', 'flex');
    }

    function handleNoFileScenario() {
        filePreview.html('');
        filePreview.css('display', 'none');
        fileInput.prop('required', true);
    }

    fileInput.on('change', function () {
        filePreview.html('');
        filePreview.css('display', 'flex');
        const files = this.files;

        if (files.length === 0) {
            handleNoFileScenario();
            return;
        }

        Array.from(files).forEach(file => {
            const fileItem = $('<div>').addClass('file-item');

            if (file.type.startsWith('image/')) {
                const img = $('<img>');
                img.attr('src', URL.createObjectURL(file));
                img.on('load', function () {
                    URL.revokeObjectURL(this.src);
                });
                fileItem.append(img);
            }

            const info = $('<p>').text(`Name: ${file.name}`);
            fileItem.append(info);

            filePreview.append(fileItem);
        });

        fileInput.prop('required', false);
    });
    if (image_link) {
        displayImageFromLink(image_link, 'Previous Image');
    }
});


function changeButton(event, id, tag) {
    event.preventDefault();
    const button = $('#CatBtn');
    button.html(tag);
    button.val(id);
}

async function editProduct(event, id) {
    event.preventDefault();
    const name = $('#ProName').val();
    const full = $('#FullDes').val();
    const tag = $('#CatBtn').val();
    const price = parseFloat($('#Price').val());
    const quantity = parseInt($('#Quantity').val());
    const fileInput = $('#fileInput')[0];
    const files = fileInput.files;
    if (!image_link && fileInput.files.length === 0) {
        return alert('Please choose an image for this product');
    }
    if (tag === 0) {
        return alert("Please choose category for this products");
    }
    let dest;
    if (fileInput.files.length !== 0) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        try {
            const response = await fetch('http://localhost:3000/product/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            dest = result.files;
        } catch (error) {
            alert(error.message);
            console.error(error.message);
        }

        if (!dest) {
            return alert("Error Upload image");
        }
    } else {
        dest = [{ path: image_link }];
    }

    try {
        const response = await fetch(`http://localhost:3000/product/edit/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                name,
                description: full,
                image: dest[0].path,
                price,
                category_id: tag,
                stock: quantity,
                user
            })
        });

        if (response.ok) {
            const result = await response.json();
            alert('Product updated successfully!');
        } else {
            alert('Failed to edit Product');
            console.error(await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while editing the product.');
    }
}

async function addProduct(event) {
    event.preventDefault();
    const name = $('#ProName').val();
    const full = $('#FullDes').val();
    const tag = $('#CatBtn').val();
    const price = parseFloat($('#Price').val());
    const quantity = parseInt($('#Quantity').val());
    const fileInput = $('#fileInput')[0];
    const files = fileInput.files;
    if (!image_link && fileInput.files.length === 0) {
        return alert('Please choose an image for this product');
    }
    if (tag === 0 || tag === '0') {
        return alert("Please choose category for this products");
    }

    let dest;
    if (fileInput.files.length !== 0) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        try {
            const response = await fetch('http://localhost:3000/product/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            dest = result.files;
        } catch (error) {
            alert(error.message);
            console.error(error.message);
        }

        if (!dest) {
            return alert("Error Upload image");
        }
    } else {
        dest = [{ path: image_link }];
    }


    try {
        const response = await fetch(`http://localhost:3000/product/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description: full,
                image: dest[0].path,
                price,
                category_id: parseInt(tag),
                stock: quantity,
                user
            })
        });

        if (response.ok) {
            const result = await response.json();
            alert('Product added successfully!');
        } else {
            alert('Failed to add Product');
            console.error(await response.text());
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the product.');
    }
}