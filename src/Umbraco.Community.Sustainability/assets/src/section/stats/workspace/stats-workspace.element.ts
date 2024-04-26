import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, css, customElement, html, property, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import { DirectionModel, DirectionModelEnum, PageMetric, PagedResultPageMetricModel } from "../../../api";
import SustainabilityContext, { SUSTAINABILITY_CONTEXT } from "../../../context/sustainability.context";
import { UUIPaginationEvent } from "@umbraco-cms/backoffice/external/uui";

const elementName = "stats-workspace";

@customElement(elementName)
export class StatsRootWorkspaceElement extends UmbElementMixin(LitElement) {

  #sustainabilityContext: SustainabilityContext;

  @state()
  _data?: PagedResultPageMetricModel;

  @property({ type: Boolean })
  _loaded?: boolean = false

  @state()
  _sortingDesc = false;

  @state()
  _orderDirection: DirectionModel = DirectionModelEnum.DESCENDING;

  @state()
  _orderBy: string = "RequestDate";

  @state()
  _pageNumber = 1;

  @state()
  _pageSize = 10;

  constructor() {
    super();
    
    this.consumeContext(SUSTAINABILITY_CONTEXT, (instance) => {
      this.#sustainabilityContext = instance;

      this.observe(this.#sustainabilityContext.overviewData, (data) => {
        if (!data) return;
        this._loaded = true;
        this._data = data;
      });

      this.#getStatsData();
    });
  }

  #getStatsData() {
    if (this._sortingDesc) {
      this._orderDirection = DirectionModelEnum.DESCENDING;
    }
    else this._orderDirection = DirectionModelEnum.ASCENDING;

    this.#sustainabilityContext.getOverviewData(this._orderDirection, this._orderBy, this._pageNumber, this._pageSize);
  }

  #onChange(event: UUIPaginationEvent) {
    this._pageNumber = event.target.current;
    this.#getStatsData();
  }

  private _sortingHandler(column: string) {
    this._sortingDesc = this._orderBy === column ? !this._sortingDesc : false;
    this._orderBy = column;
    this._pageNumber = 1;

    this.#getStatsData();
  }

  #renderPagination() {
    if (this._data?.totalPages === 1) return;
    return html`
      <uui-pagination
        .total=${this._data.totalPages}
        .current=${this._data?.pageNumber}
        @change=${this.#onChange}>
      </uui-pagination>
    `;
  }

  render() {
    if (!this._loaded) {
      return html`
        <div id="loader-container">
          <uui-loader></uui-loader>
        </div>`;
    }
    else {
      return html`
        <umb-body-layout headline="Stats">
          <div id="main">
            <uui-box>
              <uui-table>
                <uui-table-head>
                  <uui-table-head-cell></uui-table-head-cell>
                  <uui-table-head-cell style="--uui-table-cell-padding: 0">
                    <uui-button
                      style="font-weight: bold; padding: var(--uui-size-4) 0"
                      @click=${() => this._sortingHandler('RequestDate')}>
                      Last Run Date
                      <uui-symbol-sort
                        ?active=${this._orderBy === 'RequestDate'}
                        ?descending=${this._sortingDesc}>
                      </uui-symbol-sort>
                    </uui-button>
                  </uui-table-head-cell>
                  <uui-table-head-cell style="--uui-table-cell-padding: 0">
                    <uui-button
                      style="font-weight: bold; padding: var(--uui-size-4) 0"
                      @click=${() => this._sortingHandler('CarbonRating')}>
                      Carbon Rating
                      <uui-symbol-sort
                        ?active=${this._orderBy === 'CarbonRating'}
                        ?descending=${this._sortingDesc}>
                      </uui-symbol-sort>
                    </uui-button>
                  </uui-table-head-cell>
                  <uui-table-head-cell style="text-align: right;">
                    <uui-button
                      style="font-weight: bold; padding: var(--uui-size-4) 0"
                      @click=${() => this._sortingHandler('TotalSize')}>
                      Page Size
                      <uui-symbol-sort
                        ?active=${this._orderBy === 'TotalSize'}
                        ?descending=${this._sortingDesc}>
                      </uui-symbol-sort>
                    </uui-button>
                  </uui-table-head-cell>
                  <uui-table-head-cell style="text-align: right;">
                    <uui-button
                      style="font-weight: bold; padding: var(--uui-size-4) 0"
                      @click=${() => this._sortingHandler('TotalEmissions')}>
                      CO₂ per page view
                      <uui-symbol-sort
                        ?active=${this._orderBy === 'TotalEmissions'}
                        ?descending=${this._sortingDesc}>
                      </uui-symbol-sort>
                    </uui-button>                
                  </uui-table-head-cell>
                </uui-table-head>
                ${repeat(
                  this._data.items,
                  (item: PageMetric) => item,
                  (item: PageMetric) => html`
                    <uui-table-row>
                      <uui-table-cell>
                        <a href='/umbraco/section/content/workspace/document/edit/${item.nodeKey}'>
                          ${item.nodeName}
                        </a>
                      </uui-table-cell>
                      <uui-table-cell>
                        ${item.requestDate}
                      </uui-table-cell>
                      <uui-table-cell>
                        <uui-tag>
                          ${item.carbonRating}
                        </uui-tag>
                      </uui-table-cell>
                      <uui-table-cell style="text-align: right;">
                        ${(item.totalSize / 1024).toFixed(2)}KB
                      </uui-table-cell>

                      <uui-table-cell style="text-align: right;">
                        ${item.totalEmissions.toFixed(4)}g
                      </uui-table-cell>
                    </uui-table-row>
                  `
                )}
              </uui-table>

              ${this.#renderPagination()}
            </uui-box>
          </div>
        </umb-body-layout>
      `;
    }
  }

  static styles = [
    css`
      #loader-container {
				display: flex;
				justify-content: center;
				align-items: center;
				margin: 0 var(--uui-size-space-4);
			}
    `
  ]
}

export default StatsRootWorkspaceElement;

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: StatsRootWorkspaceElement;
  }
}