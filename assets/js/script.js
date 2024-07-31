document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const registroTableBody = document.getElementById('registroTableBody');
    const pagosTableBody = document.getElementById('pagosTableBody');
    const pagoPorHora = 5000;
    const downloadPdfButton = document.getElementById('downloadPdf');

downloadPdfButton.addEventListener('click', () => {
    const doc = new jspdf.jsPDF();

    doc.autoTable({
        html: '#registroTableBody',
        startY: 20,
        headStyles: { fillColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [242, 242, 242] },
        columnStyles: { 0: { cellWidth: 20 } },
        styles: { cellPadding: 2, fontSize: 8 },
        head: [['Fecha', 'Horas Trabajadas', 'Pago por Hora', 'Total a Pagar', 'Pago Adelantado', 'Horas Pendientes', 'Deuda por Horas Pendientes', 'Saldo Pendiente', 'Estado']],
    });

    doc.text("Registro de Trabajo - Cuidado de Perros", 14, 15);
    doc.save("registro_trabajo_cuidado_perros.pdf");
});

    // Función para formatear números en el formato chileno
    const formatearNumeroChileno = (numero) => {
        return numero.toLocaleString('es-CL');
    };

    // Función para formatear la fecha en el formato dd/mm/yyyy
    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const partes = fecha.split('-');
        if (partes.length !== 3) return fecha;
        const [year, month, day] = partes;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    };

    // Cargar registros desde localStorage
    const registros = JSON.parse(localStorage.getItem('registros')) || [];
    let saldoPendiente = 0;

    // Función para renderizar los registros en la tabla
    const renderRegistros = () => {
        registroTableBody.innerHTML = '';
        saldoPendiente = 0; // Resetear saldo pendiente

        registros.forEach((registro, index) => {
            const totalAPagar = registro.horas * pagoPorHora;
            const horasPendientes = registro.pagoAdelantado ? (registro.pagoAdelantado / pagoPorHora) - registro.horas : 0;
            const deudaPorHorasPendientes = horasPendientes > 0 ? horasPendientes * pagoPorHora : 0;

            // Actualizar saldo pendiente solo si no está pagado
            if (!registro.pagado) {
                saldoPendiente += totalAPagar - registro.pagoAdelantado;
            }

            // Asegurarse de que el saldo pendiente no sea negativo
            if (saldoPendiente < 0) {
                saldoPendiente = 0;
            }

            const row = document.createElement('tr');
            row.classList.add(registro.pagado ? 'pagado' : 'pendiente');
            row.innerHTML = `
                <td data-label="Fecha">${formatearFecha(registro.fecha)}</td>
                <td data-label="Horas Trabajadas">${registro.horas}</td>
                <td data-label="Pago por Hora">${formatearNumeroChileno(pagoPorHora)}</td>
                <td data-label="Total a Pagar">${formatearNumeroChileno(totalAPagar)}</td>
                <td data-label="Pago Adelantado">${formatearNumeroChileno(registro.pagoAdelantado || 0)}</td>
                <td data-label="Horas Pendientes">${horasPendientes > 0 ? horasPendientes : 0}</td>
                <td data-label="Deuda por Horas Pendientes">${formatearNumeroChileno(deudaPorHorasPendientes)}</td>
                <td data-label="Saldo Pendiente">${formatearNumeroChileno(saldoPendiente)}</td>
                <td data-label="Acciones">
                    <button class="delete-btn" data-index="${index}">Eliminar</button>
                    ${!registro.pagado ? `<button class="mark-paid-btn" data-index="${index}">Marcar como Pagado</button>` : ''}
                </td>
            `;
            registroTableBody.appendChild(row);
        });

        // Añadir event listeners a los botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                eliminarRegistro(index);
            });
        });

        // Añadir event listeners a los botones de marcar como pagado
        document.querySelectorAll('.mark-paid-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                marcarComoPagado(index);
            });
        });
    };

    // Función para renderizar los pagos en la tabla de pagos
    const renderPagos = () => {
        pagosTableBody.innerHTML = '';

        registros.forEach((registro) => {
            const totalAPagar = registro.horas * pagoPorHora;
            const saldoPendiente = totalAPagar - (registro.pagoAdelantado || 0);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFecha(registro.fecha)}</td>
                <td>${formatearNumeroChileno(registro.pagoAdelantado || 0)}</td>
                <td>${formatearNumeroChileno(totalAPagar)}</td>
                <td>${formatearNumeroChileno(saldoPendiente)}</td>
            `;
            pagosTableBody.appendChild(row);
        });
    };

    // Función para eliminar un registro
    const eliminarRegistro = (index) => {
        registros.splice(index, 1);
        localStorage.setItem('registros', JSON.stringify(registros));
        renderRegistros();
        renderPagos();
    };

    // Función para marcar un registro como pagado
    const marcarComoPagado = (index) => {
        registros[index].pagado = true;
        localStorage.setItem('registros', JSON.stringify(registros));
        renderRegistros();
        renderPagos();
    };

    // Renderizar registros y pagos al cargar la página
    renderRegistros();
    renderPagos();

    // Manejar el envío del formulario
    registroForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fecha = document.getElementById('fecha').value;
        const horas = document.getElementById('horas').value;
        const pagoAdelantado = document.getElementById('pagoAdelantado').value;

        const nuevoRegistro = {
            fecha,
            horas: parseInt(horas),
            pagoAdelantado: pagoAdelantado ? parseInt(pagoAdelantado) : 0,
            pagado: false
        };

        registros.push(nuevoRegistro);
        localStorage.setItem('registros', JSON.stringify(registros));

        renderRegistros();
        renderPagos();

        registroForm.reset();

        // Redirigir a la página de inicio
        window.location.href = 'index.html';
    });

    // Manejar la navegación entre secciones
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');

            sections.forEach(section => {
                if (section.id === target) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
    flatpickr("#fecha", {
        dateFormat: "d/m/Y",
        altInput: true,
        altFormat: "d/m/Y",
        locale: "es"
    });
});
