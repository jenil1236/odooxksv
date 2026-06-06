import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GET /api/rfqs/[id]/comparison — Get comparison data with recommendation logic
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["ADMIN", "PROCUREMENT_OFFICER", "MANAGER_APPROVER"]);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      select: { id: true, title: true, category: true, status: true },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Fetch all submitted or revised quotations
    const quotations = await prisma.quotation.findMany({
      where: {
        rfqId: id,
        status: { in: ["SUBMITTED", "REVISED", "SELECTED", "REJECTED"] },
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            rating: true,
            status: true,
          },
        },
        items: {
          select: {
            deliveryDays: true,
          },
        },
      },
    });

    if (quotations.length === 0) {
      await logActivity(session.userId, "COMPARISON_VIEWED", `Viewed empty comparison screen for RFQ "${rfq.title}" (ID: ${id})`);
      return NextResponse.json({
        rfq,
        quotations: [],
        recommendation: null,
      });
    }

    // Precalculate delivery days for each quotation (max of its items)
    const quotationsWithDelivery = quotations.map((q) => {
      const maxDelivery = q.items.length > 0 ? Math.max(...q.items.map((i) => i.deliveryDays)) : 0;
      const ratingVal = q.vendor.rating ? Number(q.vendor.rating) : 0;
      return {
        ...q,
        deliveryDays: maxDelivery,
        ratingVal,
      };
    });

    const grandTotals = quotationsWithDelivery.map((q) => q.grandTotal);
    const deliveries = quotationsWithDelivery.map((q) => q.deliveryDays);

    const minTotal = Math.min(...grandTotals);
    const maxTotal = Math.max(...grandTotals);
    const minDelivery = Math.min(...deliveries);
    const maxDelivery = Math.max(...deliveries);

    // Compute recommendation scores and badges
    let bestScore = -1;
    let recommendedId = "";

    const comparedQuotations = quotationsWithDelivery.map((q) => {
      // Normalizations
      const priceScore = maxTotal === minTotal ? 1.0 : 1.0 - (q.grandTotal - minTotal) / (maxTotal - minTotal);
      const deliveryScore = maxDelivery === minDelivery ? 1.0 : 1.0 - (q.deliveryDays - minDelivery) / (maxDelivery - minDelivery);
      const ratingScore = q.ratingVal / 5.0; // 0 to 5 scale

      // Weighted calculation
      const recommendationScore = Number(((priceScore * 60) + (deliveryScore * 25) + (ratingScore * 15)).toFixed(2));

      if (recommendationScore > bestScore) {
        bestScore = recommendationScore;
        recommendedId = q.id;
      }

      return {
        id: q.id,
        rfqId: q.rfqId,
        status: q.status,
        notes: q.notes,
        paymentTerms: q.paymentTerms,
        subtotal: q.subtotal,
        gstPercent: q.gstPercent,
        grandTotal: q.grandTotal,
        submittedAt: q.submittedAt,
        deliveryDays: q.deliveryDays,
        vendor: {
          id: q.vendor.id,
          companyName: q.vendor.companyName,
          rating: q.ratingVal,
          status: q.vendor.status,
        },
        isLowestPrice: q.grandTotal === minTotal,
        isFastestDelivery: q.deliveryDays === minDelivery,
        recommendationScore,
      };
    });

    const recommendedQuot = comparedQuotations.find((q) => q.id === recommendedId) || null;

    let recommendation = null;
    if (recommendedQuot) {
      recommendation = {
        quotationId: recommendedQuot.id,
        vendorName: recommendedQuot.vendor.companyName,
        score: recommendedQuot.recommendationScore,
        price: recommendedQuot.grandTotal,
        delivery: recommendedQuot.deliveryDays,
        rating: recommendedQuot.vendor.rating,
      };
    }

    // Logs
    await logActivity(session.userId, "COMPARISON_VIEWED", `Viewed comparison screen for RFQ "${rfq.title}" (ID: ${id})`);
    if (recommendation) {
      await logActivity(
        session.userId,
        "RECOMMENDATION_GENERATED",
        `System recommended vendor "${recommendation.vendorName}" (Score: ${recommendation.score}) for RFQ "${rfq.title}"`
      );
    }

    return NextResponse.json({
      rfq,
      quotations: comparedQuotations,
      recommendation,
    });
  } catch (err) {
    console.error("[rfqs/[id]/comparison GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
