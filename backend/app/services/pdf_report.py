import os
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(filepath: str, stats: dict, recent_threats: list) -> str:
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#1F2937'),
        leading=14
    )
    
    story = []
    
    # Title banner
    story.append(Paragraph("DefenderAI – SOC Executive Security Report", title_style))
    story.append(Spacer(1, 10))
    
    # Date
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    story.append(Paragraph(f"<b>Generated:</b> {date_str} (UTC) | <b>Scope:</b> Global SOC Threat Log", body_style))
    story.append(Spacer(1, 15))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", section_style))
    summary_text = (
        "This report summarizes security events and vulnerability scanning patterns identified "
        "by the DefenderAI automated detection system. Critical alerts were automatically prioritized "
        "into the Incident Management queue, and recommendations are provided to harden external firewalls."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 15))
    
    # Stats Table
    story.append(Paragraph("SOC Security Metrics", section_style))
    data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Count</b>", body_style)],
        ["Total Logs Processed", str(stats.get("total_logs", 0))],
        ["Threats Detected", str(stats.get("threats_detected", 0))],
        ["Critical Severity Alerts", str(stats.get("critical_alerts", 0))],
        ["High Severity Alerts", str(stats.get("high_alerts", 0))],
        ["Medium Severity Alerts", str(stats.get("medium_alerts", 0))],
        ["Low Severity Alerts", str(stats.get("low_alerts", 0))]
    ]
    
    t = Table(data, colWidths=[250, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor('#F1F5F9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Recent Threats Table
    story.append(Paragraph("Recent Critical & High Threat Vectors", section_style))
    if not recent_threats:
        story.append(Paragraph("No critical or high-risk threat vectors identified in active logs.", body_style))
    else:
        threat_data = [
            [Paragraph("<b>Source IP</b>", body_style),
             Paragraph("<b>Threat Type</b>", body_style),
             Paragraph("<b>Severity</b>", body_style),
             Paragraph("<b>MITRE ATT&CK Mapping</b>", body_style)]
        ]
        for tr in recent_threats[:10]:
            threat_data.append([
                tr.get("source_ip") or "N/A",
                tr.get("threat_type", "N/A"),
                tr.get("severity", "medium").upper(),
                tr.get("mitre_technique_id", "N/A")
            ])
        
        t_threats = Table(threat_data, colWidths=[120, 130, 90, 160])
        t_threats.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        story.append(t_threats)
        
    story.append(Spacer(1, 20))
    
    # Recommendations
    story.append(Paragraph("Remediation Actions & Recommendations", section_style))
    rec_text = (
        "• <b>Credential Guard (Brute Force):</b> Enforce rate limiting on public-facing gateways and implement Multi-Factor Authentication (MFA).<br/>"
        "• <b>Web Security (SQLi/XSS):</b> Audit query bindings, enforce prepared parameterizations, and apply sanitization scripts.<br/>"
        "• <b>Network Hardening (Port Probe):</b> Block port scan signatures at router interface levels and sandbox execution modules."
    )
    story.append(Paragraph(rec_text, body_style))
    
    doc.build(story)
    return filepath
