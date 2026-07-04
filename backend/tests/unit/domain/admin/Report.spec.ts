// backend/tests/unit/domain/admin/Report.spec.ts
import { Report } from '../../../../src/domain/admin/Report';
import { ReportReason } from '../../../../src/domain/admin/value-objects/ReportReason';
import { ReportStatus } from '../../../../src/domain/admin/value-objects/ReportStatus';

describe('Report Entity', () => {
  it('should create a valid report with default status PENDING', () => {
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
    expect(report.reason).toBe(ReportReason.INCORRECT_INGREDIENTS);
    expect(report.details).toBe('Gluten is missing from the list');
    expect(report.status).toBe(ReportStatus.PENDING);
    expect(report.createdAt).toBeInstanceOf(Date);
    expect(report.updatedAt).toBeInstanceOf(Date);
  });

  it('should fail if reporterId is missing', () => {
    const result = Report.create({
      reporterId: '',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
    });
    expect(result.isFailure).toBe(true);
  });

  it('should fail if productId is missing', () => {
    const result = Report.create({
      reporterId: 'user-1',
      productId: '',
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

  it('should not allow changing status if report is already RESOLVED', () => {
    const report = Report.create({
      reporterId: 'user-1',
      productId: 'prod-1',
      reason: ReportReason.OTHER,
      status: ReportStatus.RESOLVED,
    }).getValue();

    const changeResult = report.changeStatus(ReportStatus.PENDING);
    expect(changeResult.isFailure).toBe(true);
    expect(changeResult.getError()).toBe('Cannot change status of a closed report.');
    expect(report.status).toBe(ReportStatus.RESOLVED);
  });
});
