var app = new Vue({
    el: '#app',
    data:{
        version: "0.0",
        mode: -1,
        schoolList: [],
        schoolGroupList: [],
        targetSchoolList: [],
        menuGroupList: [],
        monthlyMenuList: [],
        targetMenuList: [],
        clickedMenu: '',
        ingredientList: [],
        targetDate: '',
        schoolName: '',
        energy: '',
        protein: '',
    },
    created(){
        // 日付を今日に指定
        this.setDateToday()
        // 学校データの取得
        this.getSchools()
        // クッキーの確認、メニューデータの取得
        this.checkCookies();
    },
    methods:{
        setDateToday(){
            const today = this.getFormatedDate(new Date(), 'menu');
            this.targetDate = today;
        },

        getSchools(){
            fetch('./data/school/school.csv')
            .then(res => res.text())
            .then(schoolList => (this.convertSchoolCsvToDictionary(schoolList)));
        },

        resetCookies(){
            console.debug('resetCookies() ---->')
            console.debug(this.$cookies.keys());
            this.$cookies.keys().forEach(cookie => {
                this.$cookies.remove(cookie);
                location.reload();
            });
        },
        checkCookies(){
            console.debug('checkCookies() ---->');
            this.$cookies.config(60 * 60 * 24 * 30, '');
            setTimeout(function() {
                if(this.$cookies.isKey('schoolGroup') && this.$cookies.isKey('menuGroup')) {
                    this.mode = 2;
                    this.schoolName = this.$cookies.get('schoolName');
                    this.getMenuCsvFile();
                } else {
                    this.mode = 0;
                }
            }.bind(this), 1000);
        },
        convertSchoolCsvToDictionary(str){

            let lines = str.split('\r\n');
            lines.shift();
            let schoolList = [];

            for (let i = 0; i < lines.length; i++) {
                line = lines[i].split(',');

                let school = {}
                school.schoolPrefectures = line[0]
                school.schoolMunicipalities = line[1]
                school.schoolGroup = line[2]
                school.schoolName = line[3]
                school.menuCsvFile = line[4]

                if (!(this.schoolGroupList.includes(school.schoolGroup) )) {
                    this.schoolGroupList.push(school.schoolGroup);
                }
                this.schoolList.push(school);
            }
        },
        convertMenuCsvToDictionary(str){
            console.debug(str);
            let lines = str.split('\r\n');
            line = Encoding.convert(lines, 'UNICODE', 'SJIS');
            console.debug(lines);
            // return lines
        },
        setSchoolGroup(group) {
            // 選択されたSchoolGroupをcookieにセットして描画のmodeを変更する.
            console.debug('setSchoolGroup() ---->  ', group, this.targetSchoolList);
            this.$cookies.set('schoolGroup', group);
            this.mode = 1;

            this. setSchoolCandidateList()
        },
        setSchoolCandidateList() {
            console.debug('setSchoolCandidateList() ---->  ');
            this.targetSchoolList = this.schoolList.filter( item => item.schoolGroup === this.$cookies.get('schoolGroup'));
            let menuGroupList = this.targetSchoolList.map(function(row){
                return row["menuGroup"]
            })
            this.menuGroupList = [...new Set(menuGroupList)]
            console.debug(this.targetSchoolList)
        },
        setUserSettingsToCookie(schoolName, menuGroup){
            console.debug('setUserSettingsToCookie() ----> ', schoolName, menuGroup);
            this.$cookies.set('schoolName', schoolName);
            this.$cookies.set('menuGroup', menuGroup);
            this.mode = 2;

            this.schoolName = schoolName;
            this.getMenuCsvFile();
        },
        getMenuCsvFile(){
            // cookieから表示するcsvのデータを選択して保存する。
            // 生駒市の場合:
            // ex) ea-kondate2103.csv (2021年3月の小学校A献立)
            //    　・小学校 => e
            //      ・A献立 => a, B献立 => b
            //      
            // ex) j-kondate2103.csv (2021年3月の中学校献立)
            //      ・中学校 => j
            //      ・献立は１種類のみ
            let targetCsv = '';

            targetCsv = this.schoolList.find(
                (school) => {return school.schoolName === this.$cookies.get('schoolName')}
            ).menuCsvFile
            
            const url = './data/menu/' + targetCsv;

            console.debug(url);
            this.getMonthlyMenuList(url);

        },
        stringToArray(str) {
            var array = [],i,il=str.length;
            for(i=0;i<il;i++) array.push(str.charCodeAt(i));
            return array;
        },
        getMonthlyMenuList(url){
            let monthlyMenuList = [];

            axios({
                url: url,
                method: 'GET',
                responseType: 'blob',
              })
              .then((response) =>{
                let reader = new FileReader();
                reader.readAsBinaryString(new Blob([response.data], {type: 'text/csv'}));
                reader.onload = function (event) {
                    const result = event.target.result;
                    const sjisArray = this.stringToArray(result);
                    const uniArray = Encoding.convert(sjisArray, {to:'UNICODE', from:'SJIS'});
                    monthlyMenuList = Encoding.codeToString(uniArray).replace(/\"/g, "").split('\r\n');
                    monthlyMenuList.shift();
                    console.debug('MonthlyMenuList: ', monthlyMenuList);
                    this.setMonthlyMenuList(monthlyMenuList);

                    let targetMenu = this.getTargetMenuList(monthlyMenuList, this.targetDate);
                    console.debug('Today: ', targetMenu);

                }.bind(this);
              });

            return this.monthlyMenuList
        },
        getTargetMenuList(menuList, date){
            let targetMenuList = menuList.filter( function(el) {
                return el.split(',')[0] == date
            });

            for (let i = 0; i < targetMenuList.length; i++) {
                let menuLine = targetMenuList[i].split(',');
                if ( i == 0 ){
                    this.energy = menuLine[5];
                    this.protein = menuLine[6];
                    console.debug()
                }
                if (!(this.targetMenuList.includes(menuLine[2]))) {
                    this.targetMenuList.push(menuLine[2]);
                }
            }
            return this.targetMenuList
        },
        setMonthlyMenuList(menuList){
            this.monthlyMenuList = menuList;
        },
        showYesterdayMenu(){
            let date = this.targetDate;
            this.targetDate = this.calcFormatedDate(date, -1);
            this.targetMenuList = [];
            let targetMenuList = this.getTargetMenuList(this.monthlyMenuList, this.targetDate);
            console.debug('showYesterdayMenu: ', targetMenuList);
        },
        showTomorrowMenu(){
            let date = this.targetDate;
            this.targetDate = this.calcFormatedDate(date, 1);
            this.targetMenuList = [];
            let targetMenuList = this.getTargetMenuList(this.monthlyMenuList, this.targetDate);
            console.debug('showTomorrowMenu: ', targetMenuList);
        },
        getFormatedDate(date, mode){
            // 生駒市が提供しているcsvファイルの命名規則で 年月 が 2021年3月の場合 2103 
            // のように表現されるためそのフォーマットで日付文字列を返す。
            let formatedStringDate = '';

            const year = date.getFullYear().toString();
            let month = (date.getMonth() + 1).toString();

            // 1 : csvファイル名フォーマット
            // 2 : 献立取得用フォーマット
            if (mode == 'csv') {
                if (month.length == 1) {
                    month = '0' + month
                }
                formatedStringDate = (year.slice(2,4) + month)
            } else if (mode == 'menu'){
                const day = date.getDate().toString();
                formatedStringDate = year + '/' + month + '/' + day
            }

            return formatedStringDate
        },
        calcFormatedDate(strDate, mode){
            // mode: -1=前日, 1=翌日
            let date = new Date(strDate);
            let newDate = new Date(date.setDate(date.getDate() + mode));
            console.debug(newDate);

            let year = date.getFullYear().toString();
            let month = (date.getMonth() + 1).toString();
            let day = date.getDate().toString();
            let formatedStringDate = year + '/' + month + '/' + day;
            console.debug('calcFormatedDate: ', formatedStringDate);

            return formatedStringDate
        },
        getMenuIngredient(menu){
            // TODO: ポップアップウィンドウを表示
            // 日にちとメニュに一致するArrayを取得
            let ingredientList = [];
            let date = this.targetDate;
            let menuList = this.monthlyMenuList.filter( function(el) {
                return (el.split(',')[0] == date && el.split(',')[2] == menu);
            });

            for (let i=0; i < menuList.length; i++){
                ingredientList.push(menuList[i].split(',')[3])
            }
            
            this.clickedMenu = menu;
            this.ingredientList = ingredientList;
        },
        closeIngredientList() {
            this.clickedMenu = "";
            this.ingredientList = [];
        },
        getMenuImage(menu){
            // 献立
            let image = '';

            if (menu.includes('ごはん')){
                image = 'food_rice'
            } else if (menu.includes('牛乳') || menu.includes('ぎゅうにゅう') ){
                image = 'food_milk'
            } else if (menu.includes('からあげ')){
                image = 'food_karaage'
            } else if (menu.includes('コロッケ')){
                image = 'food_croquette'
            } else if (menu.includes('あげ')){
                image = 'food_fried'
            } else if (menu.includes('パン')){
                image = 'food_bread'
            } else if (menu.includes('ナン')){
                image = 'food_nan'
            } else if (menu.includes('うどん') || menu.includes('めん') || menu.includes('麺')){
                image = 'food_noodle'
            } else if (menu.includes('さば') || menu.includes('タラ') || menu.includes('さば') || menu.includes('さわら')){
                image = 'food_fish'
            } else if (menu.includes('みそしる') || menu.includes('じる')){
                image = 'food_misosoup'
            } else if (menu.includes('シチュー')){
                image = 'food_creamstew'
            } else if (menu.includes('すきに')){
                image = 'food_nikomi'
            } else if (menu.includes('スープ')){
                image = 'food_soup'
            } else if (menu.includes('ソテー') || menu.includes('あえ')  || menu.includes('おひたし') || menu.includes('サラダ')){
                image = 'food_kobachi'
            } else if (menu.includes('いため') || menu.includes('やさい')){
                image = 'food_vegetables'
            } else if (menu.includes('フランクフルト')){
                image = 'food_sausage'
            } else if (menu.includes('とりにく')){
                image = 'food_chicken'
            } else if (menu.includes('ゼリー')){
                image = 'food_jelly'
            } else if (menu.includes('フルーツ')){
                image = 'food_fruits'
            } else {
                image = 'food_rice'
            }
            
            return image;
        },
        getMenuImageURL(menu) {
            let image = this.getMenuImage(menu);
            return "img/" + image + ".png";
        }
    },
    computed: {
        isSplashScreenShown: function() {
            return this.mode == -1;
        },
        isSchoolGroupSelectorShown: function() {
            return this.mode == 0;
        },
        isMenuGroupSelectorShown: function(){
            return this.mode == 1;
        },
        isDailyMenuShown: function() {
            return this.mode == 2;
        },
        isIngredientListShown: function() {
            return this.ingredientList.length !== 0;
        }
    }
});
 


// var array = { '小学校': [
//     { 'A': ['あすか野小学校','生駒南二小学校','生駒北小学校','生駒南小学校','壱分小学校','真弓小学校','鹿ノ台小学校','生駒台小学校','俵口小学校','生駒東小学校','生駒小学校'] },
//     { 'B': ['桜ヶ丘小学校','生駒台小学校','俵口小学校','生駒東小学校生駒小学校桜ヶ丘小学校'] }],
//     '中学校': [
//     { 'A': ['生駒中学校','生駒南中学校','生駒北中学校','緑ヶ丘中学校','鹿ノ台中学校','上中学校','光明中学校','大瀬中学校'] }]
// }