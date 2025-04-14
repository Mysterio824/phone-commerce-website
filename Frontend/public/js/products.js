const sortValue = [
    { id: "max", name: "Giá: Cao đến Thấp" },
    { id: "min", name: "Giá: Thấp đến Cao" },
    { id: "none", name: "Giá" }
];

async function loadPage(page, per_page = 10, catID = 0) {
    try {

        const minInput = $('#MinPrice');
        const maxInput = $('#MaxPrice');
        const sort = $('#CatBtn');

        const attr = { page, per_page, catID };

        if (minInput.length && maxInput.length && sort.length) {
            attr.min = minInput.val();
            attr.max = maxInput.val();
            attr.sort = sort.val();
        }

        const res = await fetch(`http://localhost:3000/product/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attr)
        });

        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);

        const product = $('#product-container');
        const pagination = $('#pagination');
        const categoryMenu = $('#category-menu');
        const breadcrumb = $('#innerbreadCrumbs');

        product.html('');
        breadcrumb.html('');
        categoryMenu.html('');
        pagination.html('');

        const data = await res.json();
        const rs = data.data;
        const tag = rs.catID;
        const current_page = rs.page;
        const total_pages = rs.total_pages;
        const range = getPagination(current_page, total_pages, Math.min(5, total_pages));
        // render breadcrumbs
        breadcrumb.html(updateBreadcrumbs(rs.category, tag));
        // render category
        categoryMenu.html(renderMenu(rs.category));
        if (total_pages === 0) {
            return;
        }
        // render products
        rs.products.forEach(item => {
            const str = `
                <a href='/product/${item.id}' class="card product">
                    <img src="${item.image}" onerror="this.onerror=null; this.src='/imgs/image.png';" class="item-image" alt="Product Image"/>
                    <div class="card-body">
                        <span class="item-name">${item.name}</span>
                        <div style="display: flex; justify-content: space-between">
                            <div class="item-info">
                                <span>${formatNumber(item.price, 'VNĐ')}</span>
                                <span>Stock: ${item.stock > 0 ? item.stock : '<span style="color: red">Out of stock<span>'}</span>
                            </div>
                            <button class="add-to-cart-btn" onclick="addToCart(event, '${item.id}')"><h5>+</h5></button>
                        </div>
                    </div>
                </a>`;
            product.append($.parseHTML(str));
        });

        // render pagination
        let isDisabled = current_page === 1 ? 'disabled' : '';
        pagination.append(
            $.parseHTML(`<li class="page-item ${isDisabled}"><button class="page-link" onclick="loadPage(${current_page - 1}, ${per_page}, ${tag})">&lt;</button></li>`)
        );

        range.forEach(i => {
            const isActive = i === current_page ? 'active' : '';
            pagination.append(
                $.parseHTML(`<li class="page-item ${isActive}"><button class="page-link" onclick="loadPage(${i}, ${per_page}, ${tag})">${i}</button></li>`)
            );
        });

        isDisabled = current_page === total_pages ? 'disabled' : '';
        pagination.append(
            $.parseHTML(`<li class="page-item ${isDisabled}"><button class="page-link" onclick="loadPage(${current_page + 1}, ${per_page}, ${tag})">&gt;</button></li>`)
        );
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function formatNumber(value, suffix = '', fix = 2) {
    const roundedValue = parseFloat(value).toFixed(fix);
    const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(roundedValue);
    return formattedValue + (suffix ? ` ${suffix}` : '');
}

function getPagination(currentPage, totalPages, maxVisible) {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisible - 1, totalPages);

    if (end - start < maxVisible - 1) {
        start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function changeButton(event, id, tag) {
    event.preventDefault();
    const button = $('#CatBtn');
    button.html(tag);
    button.val(id);
    loadPage(1, 10, 0, query);
}

function addToCart(event, productId, quantity = 1) {
    event.stopPropagation();
    event.preventDefault();

    fetch(`http://localhost:3000/cart/add`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, uid })
    }).then(res => {
        if (res.redirected) {
            window.location.href = res.url;
        }
        return res.json();
    }).then(data => {
        if (!data.success) throw new Error(data.message);

        const toastHTML = `
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="1500">
                    <div class="toast-header">
                        <strong class="me-auto">Notification</strong>
                        <small class="text-body-secondary">Just now</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        You added new product to your cart!
                    </div>
                </div>`;
        const toastContainer = $('#toast-container');
        toastContainer.append(toastHTML);

        const toastElement = toastContainer.children().last();
        const toast = new bootstrap.Toast(toastElement[0]);
        toast.show();
        toastElement.on('hidden.bs.toast', () => toastElement.remove());
    })
}

function renderMenu(categories, level = 1) {
    return categories
        .map(category => `
            <li class="dropdown-item">
                <div 
                    class="category-item"
                    id="${category.id}" 
                    onclick="loadPage(1, 10, '${category.id}')"
                >
                    <span style="padding: 15px">${category.name}</span>
                </div>
                ${category.children?.length > 0
                ? `<ul class="dropdown-menu level-${level + 1}">
                        ${renderMenu(category.children, level + 1)}
                   </ul>`
                : ""}
            </li>
        `)
        .join("");
}

function updateBreadcrumbs(categories, catID) {
    const path = findCategoryById(categories, catID);
    let breadcrumbsHTML = '';
    if (path) {
        breadcrumbsHTML = ` <i class="fa-solid fa-angle-right"></i> ` + path
            .map(category => {
                if (category.children && category.children.length > 0) {
                    return `<div class="breadcrumbs">
                                <span class="cate" onclick="loadPage(1, 10, '${category.id}')"> ${category.name} </span>
                                <ul class="dropdown-menu"> ${renderMenu(category.children)} </ul> 
                            </div>`;
                }
                return `<div class="breadcrumbs"> <span class="cate" onclick="loadPage(1, 10, '${category.id}')">${category.name}</span> </div>`;
            })
            .join(` <i class="fa-solid fa-angle-right"></i> `);
    }
    return breadcrumbsHTML;
}

function findCategoryById(categories, catID, path = []) {
    for (let category of categories) {
        const currentPath = [...path, category];
        if (category.id === catID) {
            return currentPath;
        }
        if (category.children && category.children.length > 0) {
            const foundPath = findCategoryById(category.children, catID, currentPath);
            if (foundPath) return foundPath;
        }
    }
    return null;
}

$(document).ready(() => {
    loadPage(1, 10, 0);
});
