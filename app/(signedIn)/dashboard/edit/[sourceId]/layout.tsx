import React, { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { redirect } from "next/navigation";
import { URL_DASHBOARD } from "@/utils/routes";
import { getSourceEditBaseline } from "@/utils/server/getSourceFeedFormBaseline";
import { FormSessionProvider } from "@/context/formSessionContext";
import { FeedFormProvider } from "@/context/feedFormContext";
import FeedFormShell from "@/features/feed/FeedFormShell";
import SelfEditSessionBanner from "@/features/feed/components/SelfEditSessionBanner";
import ResetSourceChanges from "@/features/feed/ResetSourceChanges";
import { GET_SELF_EDIT_STORAGE_KEYS } from "@/utils/constants";
import { FormSession } from "@/types/zodTypes";

export const dynamic = "force-dynamic";

export default async function SourceEditLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ sourceId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect(`/login?reason=unauthorized`);
  }

  const { sourceId } = await params;
  if (!sourceId) {
    console.warn(`[SourceEditLayout] Missing sourceId in route params`);
    redirect(`${URL_DASHBOARD}?reason=notFound`);
  }

  let baselineResult;
  try {
    baselineResult = await getSourceEditBaseline(sourceId);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[SourceEditLayout] Failed to load baseline for source ${sourceId}:`,
      msg,
    );
    if (msg.includes("Unauthorized")) {
      redirect(`${URL_DASHBOARD}?reason=unauthorized`);
    } else if (msg.includes("not found")) {
      redirect(`${URL_DASHBOARD}?reason=notFound`);
    } else if (msg.includes("creator")) {
      redirect(`${URL_DASHBOARD}?reason=notOwner`);
    } else if (msg.includes("PENDING")) {
      redirect(`${URL_DASHBOARD}?reason=notPending`);
    } else if (msg.includes("review is currently in progress")) {
      redirect(`${URL_DASHBOARD}?reason=inReview`);
    } else {
      redirect(`${URL_DASHBOARD}?reason=notFound`);
    }
  }

  const { baseline, initialState, mMSource } = baselineResult;

  const formSession: FormSession = {
    mode: "self-source-edit",
    selfEdit: {
      mMSourceId: mMSource.id,
      authorId: session.user.id,
    },
  };

  const storageKey = GET_SELF_EDIT_STORAGE_KEYS(sourceId).feedForm;

  return (
    <FormSessionProvider session={formSession}>
      <FeedFormProvider storageKey={storageKey} initialState={initialState}>
        <FeedFormShell
          title={`Edit: ${mMSource.title ?? "Untitled MM Source"}`}
          banner={
            <SelfEditSessionBanner
              baseline={baseline}
              mMSource={mMSource}
            />
          }
          asideExtra={<ResetSourceChanges initialState={initialState} />}
        >
          {children}
        </FeedFormShell>
      </FeedFormProvider>
    </FormSessionProvider>
  );
}
