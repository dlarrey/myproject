import Ember from 'ember';
var Photo = Ember.Object.extend({
        title: '',
        username: '',
        //url: '',
        //flickr extra data
        owner: '',
        //flickr url data
        id: '',
        farm: 0,
        secret: '',
        server: '',
        url: function(){
        return "https://farm"+this.get('farm')+
        ".staticflickr.com/"+this.get('server')+
        "/"+this.get('id')+"_"+this.get('secret')+"_b.jpg";
    }.property('farm','server','id','secret'),
});

// var PhotoCollection = Ember.ArrayProxy.extend(Ember.SortableMixin, {
//     sortProperties: ['title'],
//     sortAscending: true,
//     content: [],
// });
// var testPhotos = PhotoCollection.create();
// var testimg1 = Photo.create({
//     title: "Google logo",
//     username: "google",
//     url: "https://www.google.com/images/srpr/logo11w.png"
// });
// var testimg2 = Photo.create({
//     title: "UNO logo",
//     username: "UNO",
//     url: "http://www.unomaha.edu/_files/images/logo-subsite-o-2.png"
// });
// var testimg3 = Photo.create({
//     title: "Facebook Logo",
//     username: "Facebook",
//     url: "https://www.facebook.com/images/fb_icon_325x325.png"
// });
// var testimg4 = Photo.create({
//     title: "Hubble Carina Nebula",
//     username: "NASA",
//     url: "http://imgsrc.hubblesite.org/hu/db/images/hs-2010-13-a-1920x1200_wallpaper.jpg"
// });
// testPhotos.pushObject(testimg1);
// testPhotos.pushObject(testimg2);
// testPhotos.pushObject(testimg3);
// testPhotos.pushObject(testimg4);

var PhotoCollection = Ember.ArrayProxy.extend(Ember.SortableMixin, {
    sortProperties: ['dates.taken'],
    sortAscending: false,
    content: [],
});

export default Ember.Controller.extend({
    photos: PhotoCollection.create(),
    searchField: '',
    tagSearchField: '',
    filteredPhotosLoaded: function(){
            return this.get('filteredPhotos').length >0;
    }.property('filteredPhotos.length'),
    tagList: ['hi','cheese'],

    filteredPhotos: function () {
        var filter = this.get('searchField');
        var rx = new RegExp(filter, 'gi');
        var photos = this.get('photos');

        return photos.filter(function(photo){
            return photo.get('title').match(rx) || photo.get('owner.username').match(rx);
        });
    }.property('photos.@each','searchField'),
    actions: {
        search: function () {
            this.set('loading', true);
            this.get('photos').content.clear();
            this.store.unloadAll('photo');
            this.send('getPhotos',this.get('tagSearchField'));
        },
        
        getPhotos: function(tag){
            var apiKey = '4435e3a217bc7afc94dfcba607b70eb1';
            var host = 'https://api.flickr.com/services/rest/';
            var method = "flickr.photos.search";
            var requestURL = host + "?method="+method + "&api_key="+apiKey+"&tags="+tag+"&per_page=50&format=json&nojsoncallback=1";
            var photos = this.get('photos');
            var t = this;
            Ember.$.getJSON(requestURL, function(data){
                //callback for successfully completed requests
                //make secondary requests to get all of the photo information
                data.photos.photo.map(function(photoitem) {//iterate over each photo
                    var infoRequestURL = host + "?method="+"flickr.photos.getInfo" + "&api_key="+apiKey+ "&photo_id="+photoitem.id+"&format=json&nojsoncallback=1";
                    Ember.$.getJSON(infoRequestURL, function(item){
                        var photo = item.photo;
                        var tags = photo.tags.tag.map(function(tagitem){
                            return tagitem._content;
                        });
                        var newPhotoItem = t.store.createRecord('photo',{
                            title: photo.title._content,
                            dates: photo.dates,
                            owner: photo.owner,
                            description: photo.description._content,
                            link: photo.urls.url[0]._content,
                            views: photo.views,
                            tags: tags,
                            //flickr url data
                            id: photo.id,
                            farm: photo.farm,
                            secret: photo.secret,
                            server: photo.server,
                        });
                        photos.pushObject(newPhotoItem);
                    });
                });
            });
        },

        init: function(){
            this._super.apply(this, arguments);
            var apiKey = '4435e3a217bc7afc94dfcba607b70eb1';
            var host = 'https://api.flickr.com/services/rest/';
            var method = "flickr.tags.getHotList";
            var requestURL = host + "?method="+method + "&api_key="+apiKey+"&count=75&format=json&nojsoncallback=1";
            var t = this;
            Ember.$.getJSON(requestURL, function(data){
                //callback for successfully completed requests
                console.log(data);
                data.hottags.tag.map(function(tag) {
                    t.get('tagList').pushObject(tag._content);
                });
            });
        },

        clicktag: function(tag){
            this.set('tagSearchField', tag);
            this.set('loading', true);
            this.get('photos').content.clear();
            this.store.unloadAll('photo');
            this.send('getPhotos',tag);
        }
    }
});
