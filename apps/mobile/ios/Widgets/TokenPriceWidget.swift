//
//  TokenPriceWidget.swift
//  TokenPriceWidget
//
//  Created by Eric Huang on 6/22/23.
//

import WidgetKit
import SwiftUI
import Intents
import OSLog
import WidgetsCore
import Apollo
import Charts

let placeholderPriceHistory = [
  PriceHistory(timestamp: 1689792001, price: 2161),
  PriceHistory(timestamp: 1689792245, price: 2160),
  PriceHistory(timestamp: 1689792571, price: 2163),
  PriceHistory(timestamp: 1689792894, price: 2164),
  PriceHistory(timestamp: 1689793209, price: 2166),
  PriceHistory(timestamp: 1689793465, price: 2163),
  PriceHistory(timestamp: 1689793781, price: 2164),
  PriceHistory(timestamp: 1689794035, price: 2163),
  PriceHistory(timestamp: 1689794381, price: 2164),
  PriceHistory(timestamp: 1689794701, price: 2167),
  PriceHistory(timestamp: 1689794997, price: 2167),
  PriceHistory(timestamp: 1689795264, price: 2165)
]
let snapshotEntry = TokenPriceEntry(date: Date(), configuration: TokenPriceConfigurationIntent(), spotPrice: 2165, pricePercentChange: -9.87, symbol: "ETH", logo: UIImage(url: URL(string: "https://token-icons.s3.amazonaws.com/eth.png")), backgroundColor:  ColorExtraction.extractImageColorWithSpecialCase(imageURL: "https://token-icons.s3.amazonaws.com/eth.png"), tokenPriceHistory: TokenPriceHistoryResponse(priceHistory: placeholderPriceHistory))

let placeholderEntry = TokenPriceEntry(date: snapshotEntry.date, configuration: snapshotEntry.configuration, spotPrice: snapshotEntry.spotPrice, pricePercentChange: snapshotEntry.pricePercentChange, symbol: snapshotEntry.symbol, logo: nil, backgroundColor: nil,  tokenPriceHistory: snapshotEntry.tokenPriceHistory)

let refreshMinutes = 5
let displayName = "Token Prices"
let description = "Keep up to date on your favorite tokens."


struct Provider: IntentTimelineProvider {
  func placeholder(in context: Context) -> TokenPriceEntry {
    return placeholderEntry
  }
  
  func getSnapshot(for configuration: TokenPriceConfigurationIntent, in context: Context, completion: @escaping (TokenPriceEntry) -> ()) {
    completion(snapshotEntry)
  }
  
  func getTimeline(for configuration: TokenPriceConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    Metrics.logWidgetConfigurationChange()
    Task {
      let entryDate = Date()
      let tokenPriceResponse = try await DataQueries.fetchTokenPriceData(chain: configuration.selectedToken?.chain ?? "", address: configuration.selectedToken?.address)
      let spotPrice = tokenPriceResponse.spotPrice
      let pricePercentChange = tokenPriceResponse.pricePercentChange
      let symbol = tokenPriceResponse.symbol
      let logo = UIImage(url: URL(string: tokenPriceResponse.logoUrl ?? ""))
      var backgroundColor: UIColor? = nil
      if let logoUrl = tokenPriceResponse.logoUrl {
        backgroundColor = ColorExtraction.extractImageColorWithSpecialCase(imageURL: logoUrl)
      }
      var tokenPriceHistory: TokenPriceHistoryResponse? = nil
      
      if (context.family == .systemMedium) {
        tokenPriceHistory = try await DataQueries.fetchTokenPriceHistoryData(
          chain: configuration.selectedToken?.chain ?? "ETHEREUM",
          address: configuration.selectedToken?.address)
      }
      
      let entry = TokenPriceEntry(date: entryDate, configuration: configuration, spotPrice: spotPrice, pricePercentChange: pricePercentChange, symbol: symbol, logo: logo, backgroundColor: backgroundColor, tokenPriceHistory: tokenPriceHistory)
      let nextDate = Calendar.current.date(byAdding: .minute, value: refreshMinutes, to: entryDate)!
      let timeline = Timeline(entries: [entry], policy: .after(nextDate))
      completion(timeline)
    }
  }
}

struct TokenPriceEntry: TimelineEntry {
  let date: Date
  let configuration: TokenPriceConfigurationIntent
  let spotPrice: Double?
  let pricePercentChange: Double?
  let symbol: String
  let logo: UIImage?
  let backgroundColor: UIColor?
  let tokenPriceHistory: TokenPriceHistoryResponse?
}

struct TokenPriceWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  // redactionReasons stores context on how a widget is being asked to render covering data invalidation, loading and placeholders, and privacy reasons.
  // We use any reason to mean we should render a full placeholder UI
  @Environment(\.redactionReasons) var reasons
  @Environment(\.colorScheme) var colorScheme
  
  var entry: Provider.Entry
  
  func widgetPriceHeader(isPlaceholder: Bool) -> some View {
    return HStack(alignment: .top) {
      if (!isPlaceholder) {
        Image(uiImage: entry.logo ?? UIImage()).withIconStyle(background: .white)
        Spacer()
        Text(entry.symbol)
          .withHeadlineSmallStyle()
          .padding(.vertical, 2)
      } else {
        Placeholder.Circle(width: 40, height: 40)
        Spacer()
        Placeholder.Rectangle(width: 24, height: 16)
      }
    }
  }
  
  func priceSection(isPlaceholder: Bool) -> some View {
    return VStack(alignment: .leading, spacing: 0) {
      if (!isPlaceholder && entry.spotPrice != nil && entry.pricePercentChange != nil) {
        Text(NumberFormatter.fiatTokenDetailsFormatter(price: entry.spotPrice))
          .withHeadlineLargeStyle()
          .frame(minHeight: 28)
          .minimumScaleFactor(0.3)
          .padding(.bottom, 4)
        PricePercentChangeTextWithIcon(pricePercentChange: entry.pricePercentChange)
          .padding(.bottom, 8)
          .padding([.trailing, .leading], 4)
      } else {
        Placeholder.Rectangle(width: 108, height: 22)
          .padding(.bottom, 4)
        Placeholder.Rectangle(width: 75, height: 22)
          .padding(.bottom, 8)
          .padding(.trailing, 4)
      }
    }
  }
  
  func smallWidget() -> some View {
    return ZStack {
      if let color = entry.backgroundColor {
        Color(color)
        VStack(alignment: .leading, spacing: 0) {
          widgetPriceHeader(isPlaceholder: false).padding(.bottom, 12)
          Spacer()
          priceSection(isPlaceholder: false).padding(.bottom, 4)
          Text("\(Date(), style: .relative) ago")
            .withHeadlineSmallStyle()
        }
        .withMaxFrame()
        .padding(12)
      }
    }
  }
  
  func smallWidgetPlaceholder() -> some View {
    return ZStack {
      Color(colorScheme == .light ? .white : UIColor(.surface1))
      VStack(alignment: .leading, spacing: 0) {
        widgetPriceHeader(isPlaceholder: true).padding(.bottom, 12)
        Spacer()
        priceSection(isPlaceholder: true)
      }
      .withMaxFrame()
      .padding(12)
    }
  }
  
  func mediumWidget() -> some View {
    return ZStack {
      if let color = entry.backgroundColor {
        Color(color)
      }
      VStack(alignment: .leading, spacing: 0) {
        widgetPriceHeader(isPlaceholder: false).padding(.bottom, 8)
        Spacer()
        HStack(alignment: .top, spacing: 32) {
          if let spotPrice = entry.spotPrice {
            widgetPriceHistoryChart(priceHistory: entry.tokenPriceHistory?.priceHistory ?? [], spotPrice: spotPrice)
              .frame(width: 115.0, height: 50.0)
          } else {
            Placeholder.Rectangle(width: 115, height: 50)
          }
          priceSection(isPlaceholder: false)
        }
        .padding(.bottom, 4)
        Text("\(Date(), style: .relative) ago")
          .withHeadlineSmallStyle()
      }
      .withMaxFrame()
      .padding(16)
    }
  }
  
  func mediumWidgetPlaceholder() -> some View {
    return ZStack {
      Color(colorScheme == .light ? .white : UIColor(.surface1))
      VStack(alignment: .leading, spacing: 0) {
        widgetPriceHeader(isPlaceholder: true).padding(.bottom, 8)
        Spacer()
        HStack(alignment: .top, spacing: 32) {
          Placeholder.Rectangle(width: 115, height: 50)
          priceSection(isPlaceholder: true)
        }
      }
      .withMaxFrame()
      .padding(16)
    }
  }
  
  var body: some View {
    let deeplinkURL = URL(string: "uniswap://widget/#/tokens/\(entry.configuration.selectedToken?.chain?.lowercased() ?? "ethereum")/\(entry.configuration.selectedToken?.address ?? "NATIVE")")
    let shouldRenderPlaceholder = !reasons.isEmpty
    return ZStack {
      switch family {
      case .systemMedium:
        if (!shouldRenderPlaceholder) {
          mediumWidget()
        } else {
          mediumWidgetPlaceholder()
        }
      default:
        if (!shouldRenderPlaceholder) {
          smallWidget()
        } else {
          smallWidgetPlaceholder()
        }
      }
    }.widgetURL(deeplinkURL)
  }
}

struct TokenPriceWidget: Widget {
  let kind: String = "TokenPriceWidget"
  
  var body: some WidgetConfiguration {
    IntentConfiguration(kind: kind, intent: TokenPriceConfigurationIntent.self, provider: Provider()) { entry in
      TokenPriceWidgetEntryView(entry: entry)
    }
    .configurationDisplayName(displayName)
    .description(description)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct TokenPriceWidget_Previews: PreviewProvider {
  static var previews: some View {
    Group{
      TokenPriceWidgetEntryView(entry: snapshotEntry)
        .previewContext(WidgetPreviewContext(family: .systemSmall))
      TokenPriceWidgetEntryView(entry: snapshotEntry)
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
  }
}
