var searching = false;

//class elements
var ClassElms = {
  formSearch : 'form.search',
  inputQuery : 'form.search input.query',
  inputLanguage : '.input-group-text',
  cardResults : '.results',
  cardStatistic : '.results .card-statistic',
  cardDictionary : '.results .card-dictionary',
  cardRelated : '.results .card-related',
  cardSnippet : '.results .card-snippet'
};

//common functions
getElement = function(key) {
  return $(this.ClassElms[key]);
};

//replace html content
replaceHtml = function(contentHtml, map){
  if(map){
    for(key in map){
      contentHtml = contentHtml.replace('{'+ key +'}', map[key]);
    }
    return contentHtml;
  }
};

//global target
var formSearch, inputQuery;

//on ready
function ready() {
  formSearch = getElement('formSearch');
  inputQuery = getElement('inputQuery');
  let btnClose = formSearch.find('.btn.close');
  let btnGlass = formSearch.find('.btn.glass');

  //form submit
  formSearch.submit(function() {
    let self = $(this);
    let btnSpinner = self.find('.spinner');
    let btnSearch = self.find('.search');

    //check query value
    let queryVal = inputQuery.val();
    if (queryVal === '' || searching) {
      return false;
    }

    btnSpinner.show();
    btnSearch.hide();

    //request
    $.ajax({
      url: '/search',
      type: 'get',
      dataType: 'json',
      data: {q: queryVal},
    })
    .done(function(data) {
      if (data.success === false || data.message !== undefined) {
        alert(data.message || data.error || 'Error! Please try again.');
        return;
      }
      onSearchCompletion(data);
    })
    .fail(function() {
      alert('Error! Please try again.');
    })
    .always(function() {
      btnSpinner.hide();
      btnSearch.show();
    });
    return false;
  });

  btnGlass.click(function(e) {
    e.preventDefault();
    formSearch.submit();
  });

  btnClose.click(function(e) {
    inputQuery.focus();
  });

  inputQuery.keyup(function() {
    if ($(this).val() === '') {
      btnClose.hide();
    } else {
      btnClose.show();
    }
  });
}
//end on ready


//on searching
var onSearchCompletion = function(data) {
  //remove cards havent template
  $('.card:not(.template)').remove();

  //if havent data then return
  if (!data.ResultDataList) {
    return;
  }

  //template cards
  let resultRelated = data.r.related;
  let cardStatistic = getElement('cardStatistic');
  let cardsStatistic = cardStatistic.find('.cards');
  let cardStatisticHtml = cardStatistic.find('.card.template').html();

  let inputLanguage = getElement('inputLanguage');
  let cardDictionary = getElement('cardDictionary');
  let cardsDictionary = cardDictionary.find('.cards');
  let cardDictionaryHtml = cardDictionary.find('.card.template').html();

  let cardRelated = getElement('cardRelated');
  let cardsRelated = cardRelated.find('.cards');
  let cardRelatedHtml = cardRelated.find('.card.template').html();

  var cardSnippet = getElement('cardSnippet');
  var cardsSnppet = cardSnippet.find('.cards');

  //bind dictionary
  let resultDescription = data.ResultDescription;
  let language = resultDescription.Language ? resultDescription.Language.toUpperCase() : 'EN';
  let mapsDictionary = {
    'language' : language,
    'query' :  inputQuery.val(),
    'translation' : resultDescription.Translation ? resultDescription.Translation : ''
  };
  inputLanguage.text(language);
  cardDictionaryHtml = replaceHtml(cardDictionaryHtml, mapsDictionary);
  cardDictionaryHtml = $('<div>' + cardDictionaryHtml + '</div>');
  cardDictionaryHtml.addClass('card');
  cardsDictionary.append(cardDictionaryHtml);

  //bind statistic result and related word
  let relatedCount = 0;
  let mapsRelated;
  let relatedContent = '';

  if(resultRelated){
    relatedCount = resultRelated.length ? resultRelated.length : 0
  }

  if(relatedCount>0){
    $.each(resultRelated, function(i, val){
      //get only 5 results
      if(i<5){
        relatedContent += '<div class="underline related-word hover"><span>' + val.r + '</span></div>';
      }else{
        relatedContent += '<div class="underline related-word hover hide"><span>' + val.r + '</span></div>';
      }
    });
    mapsRelated = {
      'related': relatedContent
    }
    cardRelatedHtml = replaceHtml(cardRelatedHtml, mapsRelated);
    cardRelatedHtml = $('<div>' + cardRelatedHtml + '</div>');
    cardRelatedHtml.addClass('card');
    cardsRelated.append(cardRelatedHtml);
  }

  //handle related word and see more
  let relatedWords = cardRelated.find('.related-word');
  let seeMore = cardRelated.find('.see-more');
  if(relatedCount<5){
    seeMore.addClass('hide');
  }else{
    seeMore.removeClass('hide');
  }

  let mapsStatistic = {
    'exact-count' : resultDescription.e ? resultDescription.e : 0,
    'similar-count' : resultDescription.s ? resultDescription.s : 0,
    'related-count' : relatedCount
  };

  cardStatisticHtml = replaceHtml(cardStatisticHtml, mapsStatistic);
  cardStatisticHtml = $('<div>' + cardStatisticHtml + '</div>');
  cardStatisticHtml.addClass('card');
  cardsStatistic.append(cardStatisticHtml);

  //handle click see more
  seeMore.click(function(){
    relatedWords.removeClass('hide');
    $(this).remove();
  });

  //handle click related word
  relatedWords.click(function(){
    let word = $(this).text();
    inputQuery.val(word);
    formSearch.submit();
  });

  //bind snippet
  //loop data list
  for (var i in data.ResultDataList) {
    if (!data.ResultDataList[i].SnippetList) {
      continue;
    }

    let cardSnippetHtml = cardSnippet.find('.card.template').html();
    let snippet = data.ResultDataList[i].SnippetList[0];
    if (!snippet.Content) {
      continue;
    }

    let match = data.ResultDataList[i].match;
    let domain = snippet.SourceDomain ? snippet.SourceDomain[0] : '';
    let mapsSnippet = {
      'content' : snippet.SnippetSentences[1],
      'number' : (parseInt(i) + 1),
      'paper' :  domain.Domain ? domain.Domain : '',
      'domain' : domain.Urls ? domain.Urls[0] : ''
    };

    cardSnippetHtml = replaceHtml(cardSnippetHtml, mapsSnippet);
    cardSnippetHtml = $('<div>' + cardSnippetHtml + '</div>');

    if(match === 100){
      cardSnippetHtml.addClass('exact');
      cardSnippetHtml.find('span').addClass('underline-green');
    } else {
      cardSnippetHtml.addClass('similar');
      cardSnippetHtml.find('span').addClass('underline-yellow');
    }
    cardSnippetHtml.addClass('card');
    cardsSnppet.append(cardSnippetHtml);
  }

  $('html, body').animate({scrollTop: 0}, 'fast');
};

$(document).ready(ready);
