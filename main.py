from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any
import uvicorn
import time

app = FastAPI(title="Multi-Agent Sales & Procurement System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OrderRequest(BaseModel):
    product: str
    quantity: int = Field(..., gt=0, le=2000)
    deadline: int = Field(..., gt=1, le=30)

# Database Simulasi WMS (Warehouse Management System)
WMS_DATA = {
    "Produk_X": {"stock_available": 1500, "machine_capacity_per_day": 500},
    "Produk_Y": {"stock_available": 300, "machine_capacity_per_day": 200},
    "Produk_Z": {"stock_available": 0, "machine_capacity_per_day": 1000},
}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/process_order")
async def process_order(order: OrderRequest):
    try:
        start_time = time.time()
        product = order.product
        qty = order.quantity
        deadline = order.deadline

        if product not in WMS_DATA:
            WMS_DATA[product] = {"stock_available": 500, "machine_capacity_per_day": 200}

        # ---------------------------------------------------------
        # AGENT 1: Order Ingestion Agent (Sales) - Inisiasi
        # ---------------------------------------------------------
        sales_log = f"Menerima pesanan {qty} unit {product} (Deadline: {deadline} hari). Meminta validasi dari Capacity Agent."

        # ---------------------------------------------------------
        # AGENT 2: Capacity & Inventory Agent (Gudang/Produksi)
        # ---------------------------------------------------------
        stock_avail = WMS_DATA[product]["stock_available"]
        max_prod = WMS_DATA[product]["machine_capacity_per_day"] * deadline
        total_capacity = stock_avail + max_prod

        if qty <= stock_avail:
            cap_status = "Approved"
            cap_reason = f"Stok mencukupi. Tersedia {stock_avail} unit di gudang."
            WMS_DATA[product]["stock_available"] -= qty
            final_status = "approved"
            sales_nego = "Tidak perlu negosiasi. Pesanan diteruskan ke sistem."
        elif qty <= total_capacity:
            cap_status = "Conditional Approval"
            cap_reason = f"Stok kurang ({stock_avail} unit), namun mesin dapat memproduksi sisa pesanan sebelum deadline {deadline} hari."
            WMS_DATA[product]["stock_available"] = 0
            final_status = "conditional"
            # Auto-Negotiation dari Sales Agent
            sales_nego = f"Klien ditawarkan pengiriman bertahap: {stock_avail} unit hari ini, sisanya setelah produksi selesai."
        else:
            cap_status = "Rejected"
            cap_reason = f"Kapasitas pabrik tidak mumpuni. Maksimal pemenuhan hanya {total_capacity} unit."
            final_status = "rejected"
            # Auto-Negotiation dari Sales Agent
            sales_nego = f"Menawarkan pengurangan kuantitas pesanan menjadi {total_capacity} unit maksimal kepada klien."

        # ---------------------------------------------------------
        # AGENT 3: Procurement Agent (Pengadaan)
        # ---------------------------------------------------------
        current_stock = WMS_DATA[product]["stock_available"]
        if current_stock < 500 and final_status in ["approved", "conditional"]:
            proc_status = "Action Required"
            po_qty = 1000 - current_stock # Restock otomatis ke 1000
            proc_msg = f"Sisa stok {current_stock} unit (Kritis). Draft Purchase Order (PO) sebanyak {po_qty} unit ke supplier telah dibuat otomatis."
        else:
            proc_status = "Standby"
            proc_msg = "Stok pasca-transaksi masih dalam batas aman. Tidak ada aksi pengadaan."

        elapsed = round(time.time() - start_time, 2)

        # Response distrukturisasi sesuai rancangan Multi-Agent
        return {
            "order": order.model_dump(),
            "status": final_status,
            "agents_interaction": {
                "sales_agent": {
                    "role": "Order Ingestion & Negotiation",
                    "initial_action": sales_log,
                    "negotiation_action": sales_nego
                },
                "capacity_agent": {
                    "role": "Operational Gatekeeper",
                    "decision": cap_status,
                    "reasoning": cap_reason,
                    "remaining_stock": current_stock
                },
                "procurement_agent": {
                    "role": "Supply Chain Executor",
                    "status": proc_status,
                    "action": proc_msg
                }
            },
            "elapsed_seconds": elapsed
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)