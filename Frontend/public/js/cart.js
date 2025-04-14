async function loadPage(page) {
    try {
        const per_page = 3;
        const res = await fetch(`http://localhost:3000/cart/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page, per_page, uid })
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch data:` + res.statusText);
        }

        const cart_table = $('#cart-table');
        const pagination = $('#pagination');

        cart_table.html('');
        pagination.html('');

        const rs = await res.json();
        const current_page = rs.page;
        const total_pages = rs.total_pages;
        if (total_pages === 0) {
            return;
        }
        const products = rs.cart.products;
        const range = getPagination(current_page, total_pages, Math.min(5, total_pages));

        // Render products in cart
        products.forEach((item) => {
            const str = `
                <tr id="${item.product.id}" style="height: min-content;">
                    <td class="product_cart_img">
                        <a href="/product/${item.product.id}">
                            <img src="${item.product.image}" onerror="this.onerror=null; this.src='/imgs/image.png';">
                        </a>
                    </td>
                    <td>
                        <div class="product_cart_info">
                            <h4>${item.product.name}</h4>
                            <span>${formatNumber(item.product.price, 'VNĐ')}</span>
                        </div>
                    </td>
                    <td class="quantity_item">
                        <div style="display:flex">
                            <button class="quantity-btn" data-type="minus"
                                onclick="changeQuantity('${item.product.id}', -1)"> - </button>
                            <input type="number" name="quantity" id='${item.product.id}_quantity'
                                value="${item.quantity}" onfocusout="changeQuantity('${item.product.id}', 0)">
                            <button class="quantity-btn" data-type="plus"
                                onclick="changeQuantity('${item.product.id}', 1)"> + </button>
                        </div>
                    </td>
                    <td class="cart_price" id='${item.product.id}_total'> ${formatNumber(item.price, 'VNĐ')}</td>
                    <td class="cart_close">
                        <a class="del-button" onclick="deleteProduct('${item.product.id}')">
                            <i class="fa fa-close"></i>
                        </a>
                    </td>
                </tr>`;
            cart_table.append($.parseHTML(str));
        });

        // Render pagination
        let isDisabled = current_page === 1 ? 'disabled' : '';
        pagination.append(
            $.parseHTML(`<li class="page-item ${isDisabled}"><button class="page-link" onclick="loadPage(${current_page - 1})">&lt;</button></li>`)
        );

        range.forEach((i) => {
            const isActive = i === current_page ? 'active' : '';
            pagination.append(
                $.parseHTML(`<li class="page-item ${isActive}"><button class="page-link" onclick="loadPage(${i})">${i}</button></li>`)
            );
        });

        isDisabled = current_page === total_pages ? 'disabled' : '';
        pagination.append(
            $.parseHTML(`<li class="page-item ${isDisabled}"><button class="page-link" onclick="loadPage(${current_page + 1})">&gt;</button></li>`)
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

async function changeQuantity(id, change) {
    try {
        const new_quantity = parseInt($(`#${id}_quantity`).val()) + parseInt(change);

        if (new_quantity === 0) {
            deleteProduct(id);
            return;
        }

        const res = await fetch(`http://localhost:3000/cart/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId: id, quantity: new_quantity, uid })
        });

        if (!res.ok) {
            const result = await res.json();
            alert(result.message);
            throw new Error(`${result.message}`);
        }

        const rs = await res.json();

        $("#cart-total").html(formatNumber(rs.totalPrice, 'VNĐ'));
        $(`#${id}_quantity`).val(rs.udpatedQuantity);
        $(`#${id}_total`).text(formatNumber(rs.udpatedPrice, 'VNĐ'));

    } catch (error) {
        console.error(error.message);
    }
}

async function deleteProduct(id) {
    try {
        let text = "Do you want to delete this product from cart";
        if (!confirm(text)) {
            return;
        }
        const res = await fetch(`http://localhost:3000/cart/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id, uid })
        });

        if (!res.ok) {
            const result = await res.json();
            alert(result.message);
            throw new Error(`${result.message}`);
        }
        const rs = await res.json();

        const cart_table = $('#cart-table');
        cart_table.find(`#${id}`).remove();
        $("#cart-total").html(formatNumber(rs.totalPrice, 'VNĐ'));

    } catch (error) {
        console.error(error.message);
    }
}

$(document).ready(() => {
    loadPage(1);
});