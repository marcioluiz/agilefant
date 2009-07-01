package fi.hut.soberit.agilefant.web;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import com.opensymphony.xwork2.Action;
import com.opensymphony.xwork2.ActionSupport;

import fi.hut.soberit.agilefant.business.BacklogBusiness;
import fi.hut.soberit.agilefant.model.Backlog;
import fi.hut.soberit.agilefant.model.Iteration;
import fi.hut.soberit.agilefant.model.Product;
import fi.hut.soberit.agilefant.model.Project;
import fi.hut.soberit.agilefant.model.Story;
import flexjson.JSONSerializer;

@Component("backlogAction")
@Scope("prototype")
public class BacklogAction extends ActionSupport {
    private static final long serialVersionUID = 8061288993804046816L;

    private int backlogId;

    private Set<Integer> userIds = new HashSet<Integer>();

    private Backlog backlog;
    
    private Collection<Story> stories;
        
    private String jsonData = "";

    @Autowired
    private BacklogBusiness backlogBusiness;

    
    public String edit() {
        backlog = backlogBusiness.retrieve(backlogId);
        return solveResult(backlog);
    }
    
    public String retrieveStories() {
        backlog = backlogBusiness.retrieve(backlogId);
        stories = backlog.getStories();
        return Action.SUCCESS;
    }
    
    public String getSubBacklogsAsJSON() {
        backlog = backlogBusiness.retrieveIfExists(backlogId);
        jsonData = new JSONSerializer().serialize(backlogBusiness.getChildBacklogs(backlog));
        return CRUDAction.AJAX_SUCCESS;
    }

    protected String solveResult(Backlog backlog) {
        if (backlog == null) {
            super.addActionError(super.getText("backlog.notFound"));
            return Action.ERROR;
        } else  if (backlog instanceof Product) {
            return "editProduct";
        } else if (backlog instanceof Project) {
            return "editProject";
        } else if (backlog instanceof Iteration) {
            return "editIteration";
        }
        super.addActionError(super.getText("backlog.unknownType"));
        return Action.ERROR;
    }
    
    
    public void setBacklogBusiness(BacklogBusiness backlogBusiness) {
        this.backlogBusiness = backlogBusiness;
    }

    public Set<Integer> getUserIds() {
        return userIds;
    }

    public void setUserIds(Set<Integer> userIds) {
        this.userIds = userIds;
    }
    
    public Backlog getBacklog() {
        return backlog;
    }

    public String getJsonData() {
        return jsonData;
    }
    public int getBacklogId() {
        return backlogId;
    }

    public void setBacklogId(int backlogId) {
        this.backlogId = backlogId;
    }
    
    public Collection<Story> getStories() {
        return stories;
    }
}
