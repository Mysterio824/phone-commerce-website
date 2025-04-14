// Quantity Increase/Decrease functionality
$('#increase').on('click', function () {
    let quantityInput = $('#quantity');
    quantityInput.val(parseInt(quantityInput.val()) + 1);
});

$('#decrease').on('click', function () {
    let quantityInput = $('#quantity');
    if (parseInt(quantityInput.val()) > 1) {
        quantityInput.val(parseInt(quantityInput.val()) - 1);
    }
});

async function addToCart(event, productId, quantity = 1) {
    event.stopPropagation();
    event.preventDefault();

    if (quantity === 0) {
        quantity = $('#quantity').val();
    }

    fetch(`http://localhost:3000/cart/add`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, uid })
    })
        .then(res => {
            if (res.redirected) {
                window.location.href = res.url;
            }
            return res.json();
        })
        .then(data => {
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
        .catch(err => alert(err.message));
}