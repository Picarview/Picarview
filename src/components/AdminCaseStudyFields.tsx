'use client'

export interface CaseStudyValues {
  year?: string
  services?: string[]
  deliverables?: string[]
  challenge?: string
  approach?: string
  outcomes?: Array<{ title: string; body: string }>
}

/**
 * Optional case-study inputs for a project. Used in both the "Add project" form
 * and the project editor; field names match readCaseStudy() on the server.
 */
export function AdminCaseStudyFields({ values, open = false }: { values?: CaseStudyValues; open?: boolean }) {
  const outcome = (index: number) => values?.outcomes?.[index]
  return (
    <details className="admin-case-study" open={open}>
      <summary>
        <span>Case study details</span>
        <small>Optional · shown on the project page. Empty story fields use placeholder copy; empty facts are hidden.</small>
      </summary>
      <div className="admin-case-study__grid">
        <label><span>Year</span><input name="year" defaultValue={values?.year ?? ''} placeholder="2026" maxLength={20} /></label>
        <label>
          <span>Services</span>
          <input name="services" defaultValue={values?.services?.join(', ') ?? ''} placeholder="Brand Identity, Art Direction" maxLength={300} />
          <small>Separate with commas.</small>
        </label>
        <label className="admin-case-study__wide">
          <span>Deliverables</span>
          <input name="deliverables" defaultValue={values?.deliverables?.join(', ') ?? ''} placeholder="Logo, Brand guidelines, Packaging" maxLength={300} />
          <small>Separate with commas.</small>
        </label>
        <label className="admin-case-study__wide">
          <span>The challenge</span>
          <textarea name="challenge" defaultValue={values?.challenge ?? ''} placeholder="What problem were we solving?" maxLength={2000} rows={4} />
        </label>
        <label className="admin-case-study__wide">
          <span>Our approach</span>
          <textarea name="approach" defaultValue={values?.approach ?? ''} placeholder="How did we solve it?" maxLength={2000} rows={4} />
        </label>
        <fieldset className="admin-case-study__results">
          <legend>The result · up to three highlights</legend>
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <input name={`outcome${index + 1}Title`} defaultValue={outcome(index)?.title ?? ''} placeholder={`Highlight ${index + 1} title`} maxLength={80} aria-label={`Result ${index + 1} title`} />
              <textarea name={`outcome${index + 1}Body`} defaultValue={outcome(index)?.body ?? ''} placeholder="One or two sentences" maxLength={400} rows={2} aria-label={`Result ${index + 1} description`} />
            </div>
          ))}
        </fieldset>
      </div>
    </details>
  )
}
