import { ArrowRight } from "lucide-react";

function CourseCTASection({ priceLabel, originalPriceLabel, onEnroll }) {
  return (
    <section className="cd-surface cd-cta-block">
      <p className="cd-kicker">Ready To Start?</p>
      <h2>Secure Your Seat In This Course</h2>
      <p className="cd-cta-subtext">Get guided preparation, structured modules, and mentor support in one place.</p>

      <div className="cd-cta-row">
        <span className="cd-cta-price-wrap">
          <span className="cd-cta-price">{priceLabel}</span>
          {originalPriceLabel ? <span className="cd-cta-price-original">{originalPriceLabel}</span> : null}
        </span>
        <button type="button" className="cd-btn cd-btn-primary" onClick={onEnroll}>
          Enroll Now
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

export default CourseCTASection;
