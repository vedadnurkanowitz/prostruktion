"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface EmailPreviewProps {
  subject: string;
  body: string;
  title: string;
  recipient: string;
}

const EmailPreview = ({
  subject,
  body,
  title,
  recipient,
}: EmailPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold">{title}</h4>
          <Badge variant="outline" className="text-[10px] h-5">
            To: {recipient}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy Template
            </>
          )}
        </Button>
      </div>
      <Card className="p-4 bg-gray-50 dark:bg-gray-900 border-dashed border-2 text-sm">
        <div className="space-y-4 font-sans">
          <div>
            <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              Subject
            </span>
            <div className="mt-1 font-bold text-gray-900 dark:text-gray-100 border-b pb-2">
              {subject}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              Message Content
            </span>
            <div className="mt-2 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
              {body}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const InvoiceEmailView = ({
  projectName,
  invoiceNumber,
  address,
  partnerName,
  partnerAmount,
  subName,
  subAmount,
  mediatorName,
  mediatorAmount,
  hasMediator,
  date,
}: {
  projectName: string;
  invoiceNumber: string;
  address: string;
  partnerName: string;
  partnerAmount: number | string;
  subName: string;
  subAmount: number | string;
  mediatorName?: string;
  mediatorAmount?: number | string;
  hasMediator: boolean;
  date?: string;
}) => {
  const formattedPartnerAmount =
    typeof partnerAmount === "number"
      ? partnerAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })
      : partnerAmount;

  const formattedSubAmount =
    typeof subAmount === "number"
      ? subAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })
      : subAmount;

  const formattedMediatorAmount =
    typeof mediatorAmount === "number"
      ? mediatorAmount.toLocaleString("de-DE", { minimumFractionDigits: 2 })
      : mediatorAmount;

  const templates = {
    partner: {
      subject: `Rechnung ${invoiceNumber} - ${projectName}`,
      body: `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung für das Projekt ${projectName}.

Projektdetails:
- Name: ${projectName}
- Adresse: ${address || "N/A"}
- Rechnungsbetrag: € ${formattedPartnerAmount}
- Datum: ${date || new Date().toLocaleDateString("de-DE")}

Bitte begleichen Sie den Betrag innerhalb des Zahlungsziels.

Mit freundlichen Grüßen,
Prostruktion Team`,
    },
    subcontractor: {
      subject: `Auszahlungsbestätigung ${invoiceNumber} - ${projectName}`,
      body: `Hallo ${subName || "Subunternehmer"},

wir haben die Abrechnung für das Projekt ${projectName} erstellt.

Auszahlungsbetrag (70%): € ${formattedSubAmount}
Projektadresse: ${address || "N/A"}

Der Betrag wird in Kürze angewiesen.

Mit freundlichen Grüßen,
Prostruktion Team`,
    },
    mediator: {
      subject: `Provisionsabrechnung ${invoiceNumber} - ${projectName}`,
      body: `Hallo ${mediatorName || "Vermittler"},

wir haben die Provisionsabrechnung für das Projekt ${projectName} registriert.

Provisionsbetrag (10%): € ${formattedMediatorAmount}
Projektadresse: ${address || "N/A"}

Besten Dank für die Vermittlung.

Mit freundlichen Grüßen,
Prostruktion Team`,
    },
  };

  return (
    <Tabs defaultValue="partner" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <TabsTrigger
          value="partner"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Partner
        </TabsTrigger>
        <TabsTrigger
          value="subcontractor"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
        >
          Subcontractor
        </TabsTrigger>
        <TabsTrigger
          value="mediator"
          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          disabled={!hasMediator}
        >
          Mediator
        </TabsTrigger>
      </TabsList>

      <TabsContent value="partner" className="mt-0 focus-visible:ring-0">
        <EmailPreview
          title="Partner Email Format"
          recipient={partnerName}
          subject={templates.partner.subject}
          body={templates.partner.body}
        />
      </TabsContent>

      <TabsContent value="subcontractor" className="mt-0 focus-visible:ring-0">
        <EmailPreview
          title="Subcontractor Email Format"
          recipient={subName}
          subject={templates.subcontractor.subject}
          body={templates.subcontractor.body}
        />
      </TabsContent>

      {hasMediator && (
        <TabsContent value="mediator" className="mt-0 focus-visible:ring-0">
          <EmailPreview
            title="Mediator Email Format"
            recipient={mediatorName || "Mediator"}
            subject={templates.mediator.subject}
            body={templates.mediator.body}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};
