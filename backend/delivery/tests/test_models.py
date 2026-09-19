from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from delivery.models import DeliveryGroup, DeliveryMethod, DeliveryStatus


class DeliveryGroupModelTest(TestCase):
    def test_default_values(self):
        group = DeliveryGroup(
            method=DeliveryMethod.PICKUP,
            status=DeliveryStatus.PENDING,
            delivery_fee=Decimal("0.00")
        )
        self.assertEqual(group.method, DeliveryMethod.PICKUP)
        self.assertEqual(group.status, DeliveryStatus.PENDING)
        self.assertEqual(group.delivery_fee, Decimal("0.00"))

    def test_valid_pickup_state_transitions(self):
        group = DeliveryGroup(
            method=DeliveryMethod.PICKUP,
            status=DeliveryStatus.PENDING
        )
        group.transition_to(DeliveryStatus.READY_FOR_PICKUP, save=False)
        self.assertEqual(group.status, DeliveryStatus.READY_FOR_PICKUP)

        group.transition_to(DeliveryStatus.PICKED_UP, save=False)
        self.assertEqual(group.status, DeliveryStatus.PICKED_UP)
        self.assertIsNotNone(group.picked_up_at)

        group.transition_to(DeliveryStatus.COMPLETED, save=False)
        self.assertEqual(group.status, DeliveryStatus.COMPLETED)
        self.assertIsNotNone(group.completed_at)

    def test_valid_vendor_delivery_state_transitions(self):
        group = DeliveryGroup(
            method=DeliveryMethod.VENDOR_ARRANGED,
            status=DeliveryStatus.PENDING
        )
        group.transition_to(DeliveryStatus.READY_FOR_DELIVERY, save=False)
        self.assertEqual(group.status, DeliveryStatus.READY_FOR_DELIVERY)

        group.transition_to(DeliveryStatus.IN_TRANSIT, save=False)
        self.assertEqual(group.status, DeliveryStatus.IN_TRANSIT)
        self.assertIsNotNone(group.shipped_at)

        group.transition_to(DeliveryStatus.DELIVERED, save=False)
        self.assertEqual(group.status, DeliveryStatus.DELIVERED)
        self.assertIsNotNone(group.delivered_at)

        group.transition_to(DeliveryStatus.COMPLETED, save=False)
        self.assertEqual(group.status, DeliveryStatus.COMPLETED)

    def test_illegal_state_transition_raises_validation_error(self):
        group = DeliveryGroup(
            method=DeliveryMethod.PICKUP,
            status=DeliveryStatus.PENDING
        )
        with self.assertRaises(ValidationError):
            group.transition_to(DeliveryStatus.COMPLETED, save=False)
