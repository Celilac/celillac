// backend/tests/unit/domain/admin/Report.spec.ts
import { Report } from '../../../../src/domain/admin/Report';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { ReportStatus } from '../../../../src/domain/admin/value-objects/ReportStatus';

describe('Report Entity', () => {
  it('should create a valid product report with default status PENDING', () => {
    const result = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.INCORRECT_INGREDIENTS,
      details: 'Gluten is missing from the list',
    });

    expect(result.isSuccess).toBe(true);
    const report = result.getValue();
    expect(report.reporterId).toBe('user-1');
    expect(report.productId).toBe('prod-1');
    expect(report.partnerId).toBeUndefined();
    expect(report.reason).toBe(ReportReason.INCORRECT_INGREDIENTS);
    expect(report.isFoodSafetyRisk).toBe(false);
    expect(report.details).toBe('Gluten is missing from the list');
    expect(report.status).toBe(ReportStatus.PENDING);
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a valid partner report and auto-set isFoodSafetyRisk for MISSING_ALLERGEN', () => {
    const result = Report.create({
      reporterId: 'user-1',
      partnerId: 'partner-1',
      reason: ReportReason.MISSING_ALLERGEN,
      details: 'O parceiro omitiu informações de traços de glúten no estabelecimento',
    });

    expect(result.isSuccess).toBe(true);
    const report = result.getValue();
    expect(report.reporterId).toBe('user-1');
    expect(report.productId).toBeUndefined();
    expect(report.partnerId).toBe('partner-1');
    expect(report.reason).toBe(ReportReason.MISSING_ALLERGEN);
    expect(report.isFoodSafetyRisk).toBe(true);
  });

  it('should fail if both productId and partnerId are missing', () => {
    const result = Report.create({
      reporterId: 'user-1',
      reason: ReportReason.OTHER,
    });
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe('Product ID or Partner ID is required.');
  });

  it('should fail if reporterId is missing', () => {
    const result = Report.create({
      reporterId: '',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
    });
    expect(result.isFailure).toBe(true);
  });

  it('should fail with invalid reason', () => {
    const result = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: 'INVALID_REASON' as any,
    });
    expect(result.isFailure).toBe(true);
  });

  it('should change status correctly from PENDING to IN_REVIEW', () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
    }).getValue();

    const changeResult = report.changeStatus(ReportStatus.IN_REVIEW);
    expect(changeResult.isSuccess).toBe(true);
    expect(report.status).toBe(ReportStatus.IN_REVIEW);
  });

  it('should allow reopening a RESOLVED or DISMISSED report to PENDING or IN_REVIEW', () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
      status: ReportStatus.RESOLVED,
    }).getValue();

    const reopenResult = report.reopen(ReportStatus.PENDING);
    expect(reopenResult.isSuccess).toBe(true);
    expect(report.status).toBe(ReportStatus.PENDING);

    // Reabrir para IN_REVIEW
    report.changeStatus(ReportStatus.DISMISSED);
    const reopenInReview = report.reopen(ReportStatus.IN_REVIEW);
    expect(reopenInReview.isSuccess).toBe(true);
    expect(report.status).toBe(ReportStatus.IN_REVIEW);
  });

  it('should fail reopening a report that is already open (PENDING)', () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
      status: ReportStatus.PENDING,
    }).getValue();

    const reopenResult = report.reopen(ReportStatus.PENDING);
    expect(reopenResult.isFailure).toBe(true);
    expect(reopenResult.getError()).toBe('Only closed reports can be reopened.');
  });
});
