import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../../api/adminApi";
import { PageHeader, AdminError } from "../../components/AdminUi";
import { MediaPicker } from "../../media/components/MediaPicker";
import { Field, TextInput, TextArea, Select } from "@/modules/enquiry/components/Field";
import { useSiteConfig } from "@/shared/hooks/useSiteConfig";
import { ApiError } from "@/shared/api/http";

interface FormValues {
  name: string;
  lotNumber: string;
  material: string;
  colour: string;
  whiteSubcategory: string;
  originCountry: string;
  origin: string;
  finish: string;
  thicknessMm: string;
  slabLengthIn: string;
  slabWidthIn: string;
  slabCount: string;
  areaSqFt: string;
  approxSlabSize: string;
  availability: string;
  description: string;
  internalNotes: string;
  isFeatured: boolean;
  isPublished: boolean;
  looks: string[];
  applications: string[];
}

/** Empty string means "not recorded" and must not become 0 or "". */
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
const str = (v: string) => (v.trim() === "" ? undefined : v.trim());

/**
 * Add or edit a stone — Admin Scope §1.
 *
 * The form's most important property is what it does *not* do: every field the
 * client's catalogues never recorded (origin, finish, thickness) is optional
 * and blank by default, and a blank is submitted as absent rather than as an
 * empty string. The storefront then renders "On request", which is the truth.
 * Pre-filling any of them with a plausible default would put invented data in
 * front of an architect specifying thousands of square feet.
 */
export function StoneEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { taxonomies } = useSiteConfig();

  const [imageIds, setImageIds] = useState<string[]>([]);
  const [videoIds, setVideoIds] = useState<string[]>([]);

  const { data: stone } = useQuery({
    queryKey: ["admin-stone", id],
    queryFn: () => adminApi.stone(id!),
    enabled: !isNew,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      lotNumber: "",
      /**
       * Phase-3 feedback — "Origin mostly Italy, Material marble, Finish
       * polish, Thickness 18 or 20mm". Starting values for a new lot, not
       * enforced ones: they are what almost every lot is, and the team clears
       * or changes them on the ones that are not. An existing record overwrites
       * all of this in the reset() below.
       */
      material: "marble",
      colour: "",
      whiteSubcategory: "",
      originCountry: "it",
      origin: "",
      finish: "polished",
      thicknessMm: "20",
      slabLengthIn: "",
      slabWidthIn: "",
      slabCount: "",
      areaSqFt: "",
      approxSlabSize: "",
      availability: "verification_required",
      description: "",
      internalNotes: "",
      isFeatured: false,
      isPublished: true,
      looks: [],
      applications: [],
    },
  });

  useEffect(() => {
    if (!stone) return;
    reset({
      name: stone.name,
      lotNumber: stone.lotNumber ?? "",
      material: stone.material ?? "",
      colour: stone.colour ?? "",
      whiteSubcategory: stone.whiteSubcategory ?? "",
      originCountry: stone.originCountry ?? "",
      origin: stone.origin ?? "",
      finish: stone.finish ?? "",
      thicknessMm: stone.thicknessMm?.toString() ?? "",
      slabLengthIn: stone.slabLengthIn?.toString() ?? "",
      slabWidthIn: stone.slabWidthIn?.toString() ?? "",
      slabCount: stone.slabCount?.toString() ?? "",
      areaSqFt: stone.areaSqFt?.toString() ?? "",
      approxSlabSize: stone.approxSlabSize ?? "",
      availability: stone.availability,
      description: stone.description,
      internalNotes: stone.internalNotes,
      isFeatured: stone.isFeatured,
      isPublished: stone.isPublished,
      looks: stone.looks.map((l) => l.slug),
      applications: stone.applications.map((a) => a.slug),
    });
    setImageIds(stone.imageIds);
    setVideoIds(stone.videoIds);
  }, [stone, reset]);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      isNew ? adminApi.createStone(body) : adminApi.updateStone(id!, body),
    onSuccess: (saved) => {
      toast.success(isNew ? `${saved.name} added as ${saved.mossanoCode}` : "Saved");
      queryClient.invalidateQueries({ queryKey: ["admin-stones"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stone", saved.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (isNew) navigate(`/admin/stones/${saved.id}`, { replace: true });
    },
  });

  /** The White sub-category field only exists while White is the colour. */
  const colour = watch("colour");

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        name: v.name,
        lotNumber: str(v.lotNumber),
        material: str(v.material),
        colour: str(v.colour),
        // Only meaningful under White — see stone.constants.js. Cleared rather
        // than left stale when the colour moves off White, so a lot cannot be
        // filed as "Black / Statuario".
        whiteSubcategory: v.colour === "white" ? str(v.whiteSubcategory) : undefined,
        originCountry: str(v.originCountry),
        origin: str(v.origin),
        finish: str(v.finish),
        thicknessMm: num(v.thicknessMm),
        slabLengthIn: num(v.slabLengthIn),
        slabWidthIn: num(v.slabWidthIn),
        slabCount: num(v.slabCount),
        areaSqFt: num(v.areaSqFt),
        approxSlabSize: str(v.approxSlabSize),
        availability: v.availability,
        description: str(v.description),
        internalNotes: str(v.internalNotes),
        isFeatured: v.isFeatured,
        isPublished: v.isPublished,
        looks: v.looks,
        applications: v.applications,
        imageIds,
        videoIds,
      });
    } catch (err) {
      const entries = err instanceof ApiError ? Object.entries(err.fieldErrors()) : [];
      if (entries.length) {
        entries.forEach(([key, message]) =>
          setError(key as keyof FormValues, { type: "server", message }),
        );
      } else {
        setError("root", {
          message: err instanceof Error ? err.message : "Could not save.",
        });
      }
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={isNew ? "Add a stone" : (stone?.name ?? "Stone")}
        subtitle={
          isNew
            ? "A MOSSANO code is assigned automatically."
            : `${stone?.mossanoCode ?? ""}${stone?.lotNumber ? ` · lot ${stone.lotNumber}` : ""}`
        }
        actions={
          <>
            <Link to="/admin/stones" className="btn-outline">
              Back
            </Link>
            <button type="submit" className="btn-solid" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </>
        }
      />

      {errors.root && <AdminError error={new Error(errors.root.message)} />}

      <div className="grid gap-x-12 lg:grid-cols-2">
        <section>
          <p className="label mb-5">Identity</p>
          <Field label="Stone name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register("name", { required: "A name is required" })} />
          </Field>
          <Field
            label="Supplier lot number"
            htmlFor="lotNumber"
            hint="From the supplier's own paperwork"
          >
            <TextInput id="lotNumber" {...register("lotNumber")} />
          </Field>

          <div className="grid gap-x-6 sm:grid-cols-2">
            <Field label="Material" htmlFor="material">
              <Select id="material" {...register("material")}>
                <option value="">Not recorded</option>
                {(taxonomies?.materials ?? []).map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Colour family" htmlFor="colour">
              <Select id="colour" {...register("colour")}>
                <option value="">Not recorded</option>
                {(taxonomies?.colours ?? []).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Phase-3 feedback — the sub-category under White. Shown only when
              White is chosen: on any other colour it is a field that can only
              be filled in wrongly. */}
          {colour === "white" && (
            <Field label="White sub-category" htmlFor="whiteSubcategory">
              <Select id="whiteSubcategory" {...register("whiteSubcategory")}>
                <option value="">Not recorded</option>
                {(taxonomies?.whiteSubcategories ?? []).map((w) => (
                  <option key={w.slug} value={w.slug}>
                    {w.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {/* Left blank on purpose until the client confirms them. See
              docs/CLIENT-QUESTIONS.md — the site says "On request" rather than
              guessing, and that is a feature of the listing, not a gap. */}
          <p className="label mb-3 mt-8 border-t border-ivory-dark pt-6">
            Specification — leave blank if not confirmed
          </p>
          {/* Phase-3 feedback — the country is picked, not typed: the flag on
              the stone page is built from this code, and "Itly" used to lose it
              silently. The free-text box beside it keeps the quarry or region,
              which a country code cannot carry. */}
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Field label="Origin country" htmlFor="originCountry">
              <Select id="originCountry" {...register("originCountry")}>
                <option value="">Not recorded</option>
                {(taxonomies?.countries ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Quarry or region" htmlFor="origin" hint="Optional, e.g. Carrara">
              <TextInput id="origin" placeholder="e.g. Carrara" {...register("origin")} />
            </Field>
          </div>

          <div className="grid gap-x-6 sm:grid-cols-2">
            <Field label="Finish" htmlFor="finish">
              <Select id="finish" {...register("finish")}>
                <option value="">Not recorded</option>
                {(taxonomies?.finishes ?? []).map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Thickness (mm)" htmlFor="thicknessMm">
              <TextInput id="thicknessMm" type="number" min={0} {...register("thicknessMm")} />
            </Field>
          </div>

          <p className="label mb-3 mt-8 border-t border-ivory-dark pt-6">The lot</p>
          <div className="grid gap-x-6 sm:grid-cols-2">
            <Field label="Slab length (in)" htmlFor="slabLengthIn">
              <TextInput id="slabLengthIn" type="number" min={0} {...register("slabLengthIn")} />
            </Field>
            <Field label="Slab width (in)" htmlFor="slabWidthIn">
              <TextInput id="slabWidthIn" type="number" min={0} {...register("slabWidthIn")} />
            </Field>
            <Field label="Number of slabs" htmlFor="slabCount">
              <TextInput id="slabCount" type="number" min={0} {...register("slabCount")} />
            </Field>
            <Field label="Total area (sq ft)" htmlFor="areaSqFt">
              <TextInput id="areaSqFt" type="number" min={0} {...register("areaSqFt")} />
            </Field>
          </div>

          <Field
            label="Approx. slab size"
            htmlFor="approxSlabSize"
            hint="What the stone page shows. Blank falls back to the length × width above."
          >
            <TextInput
              id="approxSlabSize"
              placeholder="8 × 4 ft approx"
              {...register("approxSlabSize")}
            />
          </Field>
        </section>

        <section>
          <p className="label mb-5">Availability</p>
          <Field
            label="Status"
            htmlFor="availability"
            hint="Changing this updates every page the stone appears on"
          >
            <Select id="availability" {...register("availability")}>
              {Object.entries(taxonomies?.availability ?? {}).map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="mt-2 space-y-3">
            <label className="flex items-center gap-3 text-[0.85rem]">
              <input
                type="checkbox"
                {...register("isPublished")}
                className="h-3.5 w-3.5 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
              />
              Visible on the website
            </label>
            <label className="flex items-center gap-3 text-[0.85rem]">
              <input
                type="checkbox"
                {...register("isFeatured")}
                className="h-3.5 w-3.5 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
              />
              Feature on the home page
            </label>
          </div>

          <p className="label mb-3 mt-8 border-t border-ivory-dark pt-6">Categorisation</p>

          {/* Controller rather than register: these are arrays of checkboxes,
              and react-hook-form's uncontrolled path does not manage array
              membership on its own. */}
          <Controller
            control={control}
            name="looks"
            render={({ field }) => (
              <fieldset className="mb-6">
                <legend className="label mb-2">Look</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(taxonomies?.looks ?? []).map((look) => (
                    <label key={look.slug} className="flex items-center gap-2 text-[0.85rem]">
                      <input
                        type="checkbox"
                        checked={field.value.includes(look.slug)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, look.slug]
                              : field.value.filter((s) => s !== look.slug),
                          )
                        }
                        className="h-3.5 w-3.5 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
                      />
                      {look.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          />

          <Controller
            control={control}
            name="applications"
            render={({ field }) => (
              <fieldset className="mb-6">
                <legend className="label mb-2">Application</legend>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(taxonomies?.applications ?? []).map((app) => (
                    <label key={app.slug} className="flex items-center gap-2 text-[0.85rem]">
                      <input
                        type="checkbox"
                        checked={field.value.includes(app.slug)}
                        onChange={(e) =>
                          field.onChange(
                            e.target.checked
                              ? [...field.value, app.slug]
                              : field.value.filter((s) => s !== app.slug),
                          )
                        }
                        className="h-3.5 w-3.5 appearance-none border border-ink/30 checked:border-ink checked:bg-ink"
                      />
                      {app.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          />

          <Field label="Description" htmlFor="description" className="mt-2">
            <TextArea id="description" {...register("description")} />
          </Field>

          <Field
            label="Internal notes"
            htmlFor="internalNotes"
            hint="Team only — never shown on the website"
          >
            <TextArea id="internalNotes" {...register("internalNotes")} />
          </Field>
        </section>
      </div>

      <div className="mt-12 space-y-12 border-t border-ivory-dark pt-10">
        <MediaPicker
          kind="slab"
          label="Slab photography"
          hint="The first image is used on cards and in link previews. Drag to reorder."
          value={imageIds}
          onChange={setImageIds}
          max={60}
        />
        <MediaPicker
          kind="video"
          label="Slab video"
          hint='Customers can request this from the stone page — "Request Actual Slab Video".'
          value={videoIds}
          onChange={setVideoIds}
          max={10}
        />
      </div>

      <div className="mt-12 flex justify-end gap-3 border-t border-ivory-dark pt-8">
        <Link to="/admin/stones" className="btn-outline">
          Cancel
        </Link>
        <button type="submit" className="btn-solid" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save stone"}
        </button>
      </div>
    </form>
  );
}
