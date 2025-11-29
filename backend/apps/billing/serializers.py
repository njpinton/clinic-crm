from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'amount']
        read_only_fields = ['amount']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount', 'payment_date', 
            'payment_method', 'reference_number', 'status', 'notes'
        ]
        read_only_fields = ['status']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'patient', 'appointment', 'invoice_number',
            'issue_date', 'due_date', 'status',
            'total_amount', 'paid_amount', 'balance_due',
            'notes', 'items', 'payments'
        ]
        read_only_fields = ['total_amount', 'paid_amount', 'balance_due']
