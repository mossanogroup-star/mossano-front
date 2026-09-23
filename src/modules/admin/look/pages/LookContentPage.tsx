import { PageHeader } from "../../components/AdminUi";
import { LookContentEditor } from "../components/LookContentEditor";

/**
 * Phase-3 feedback — Shop by Look photography, chiefly the Exotic collection.
 *
 * Its own screen rather than a panel on the applications page: the two
 * taxonomies are separate in the storefront's navigation and the client has
 * been explicit that they stay separate.
 */
export function LookContentPage() {
  return (
    <>
      <PageHeader
        title="Shop by Look"
        subtitle="The photography and copy behind each look. The first image becomes its tile."
      />
      <div className="max-w-2xl">
        <LookContentEditor />
      </div>
    </>
  );
}
